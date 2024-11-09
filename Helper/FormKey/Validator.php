<?php
/**
 * Coditron
 *
 * @category  Coditron
 * @package   Coditron_OTPVerification
 * @author    Coditron
 * @copyright Copyright (c) Coditron (https://coditron.com)
 */

namespace Coditron\OTPVerification\Helper\FormKey;

use Magento\Framework\Encryption\Helper\Security;

class Validator
{
    public const FORM_KEY_FIELD = 'form_key';

    /**
     * @var \Magento\Framework\Data\Form\FormKey
     */
    private $formKey;

    /**
     * @var \Magento\Framework\Serialize\SerializerInterface
     */
    private $serialize;

    /**
     * @param \Magento\Framework\Data\Form\FormKey $formKey
     * @param \Magento\Framework\Serialize\SerializerInterface $serialize
     */
    public function __construct(
        \Magento\Framework\Data\Form\FormKey $formKey,
        \Magento\Framework\Serialize\SerializerInterface $serialize
    ) {
        $this->formKey = $formKey;
        $this->serialize = $serialize;
    }

    /**
     * Validate
     *
     * @param \Magento\Framework\App\RequestInterface $request
     * @return boolean
     */
    public function validate(\Magento\Framework\App\RequestInterface $request)
    {
        $formKey = $request->getParam(self::FORM_KEY_FIELD, null);
        if (!$formKey) {
            if ($request instanceof \Magento\Framework\App\PlainTextRequestInterface &&
                method_exists($request, 'getContent')
            ) {
                $jsonArray = $this->serialize->unserialize($request->getContent());
                $formKey = $this->extractFormKeyFromJsonArray($jsonArray);
            }
        }
        return $formKey && Security::compareStrings($formKey, $this->formKey->getFormKey());
    }

    /**
     * Extract Form Key from json data
     *
     * @param array $jsonArray
     * @return string|null
     */
    private function extractFormKeyFromJsonArray($jsonArray): ?string
    {
        if (isset($jsonArray[self::FORM_KEY_FIELD])) {
            return $jsonArray[self::FORM_KEY_FIELD];
        }
        foreach ($jsonArray as $item) {
            if (isset($item['name'], $item['value']) && $item['name'] === self::FORM_KEY_FIELD) {
                return $item['value'];
            }
        }
        return null;
    }
}
