<?php
/**
 * Coditron
 *
 * @category  Coditron
 * @package   Coditron_OTPVerification
 * @author    Coditron
 * @copyright Copyright (c) Coditron (https://coditron.com)
 */

namespace Coditron\OTPVerification\Model\Customer\Plugin;

use Magento\Framework\Controller\Result\JsonFactory;
use Magento\Framework\Serialize\Serializer\Json as JsonSerializer;
use Magento\Framework\Session\SessionManagerInterface;
use Coditron\OTPVerification\Helper\Customer as CustomerHelper;
use Coditron\OTPVerification\Helper\Data as OtpHelper;

/**
 * Around plugin for login action.
 */
class LoginAjax
{
    /**
     * @var SessionManagerInterface
     */
    private $session;

    /**
     * @var JsonFactory
     */
    private $resultJsonFactory;

    /**
     * @var JsonSerializer
     */
    private $serializer;

    /**
     * @var OtpHelper
     */
    private $otpHelper;

    /**
     * @var CustomerHelper
     */
    private $customerHelper;

    /**
     * @param SessionManagerInterface $session
     * @param JsonFactory $resultJsonFactory
     * @param JsonSerializer $serializer
     * @param OtpHelper $otpHelper
     * @param CustomerHelper $customerHelper
     * @throws \RuntimeException
     */
    public function __construct(
        SessionManagerInterface $session,
        JsonFactory $resultJsonFactory,
        JsonSerializer $serializer = null,
        OtpHelper $otpHelper,
        CustomerHelper $customerHelper
    ) {
        $this->session = $session;
        $this->resultJsonFactory = $resultJsonFactory;
        $this->serializer = $serializer ?: \Magento\Framework\App\ObjectManager::getInstance()
            ->get(JsonSerializer::class);
        $this->otpHelper = $otpHelper;
        $this->customerHelper = $customerHelper;
    }

    /**
     *  Plugin of execute()
     *
     * @param \Magento\Customer\Controller\Ajax\Login $subject
     * @param \Closure $proceed
     * @return $this
     */
    public function aroundExecute(
        \Magento\Customer\Controller\Ajax\Login $subject,
        \Closure $proceed
    ) {
        $request = $subject->getRequest();

        $loginParams = [];
        $content = $request->getContent();
        if ($content) {
            $loginParams = $this->serializer->unserialize($content);
        }
        $username = $loginParams['username'] ?? null;
        if ($this->otpHelper->isModuleEnable() &&
            !CustomerHelper::USERNAME_EMAIL === $this->customerHelper->getCurrentUsernameType() &&
            !$this->customerHelper->isEmail($username)
        ) {
            $result = $this->customerHelper->validatePhonenumber($username);
            if (($result['errors'] && isset($result['messages'][CustomerHelper::PHONENUMBER_INVALID_FORMAT])) ||
                !$result['errors']
            ) {
                $this->session->setUsername($username);
                return $this->returnJsonError(
                    $result['messages'][CustomerHelper::PHONENUMBER_INVALID_FORMAT] ?? __('Invalid login or password.')
                );
            }
        }
        return $proceed();
    }

    /**
     * Format JSON response.
     *
     * @param \Magento\Framework\Phrase $phrase
     * @return \Magento\Framework\Controller\Result\Json
     */
    private function returnJsonError(\Magento\Framework\Phrase $phrase): \Magento\Framework\Controller\Result\Json
    {
        $resultJson = $this->resultJsonFactory->create();
        return $resultJson->setData(['errors' => true, 'message' => $phrase]);
    }
}
