<?php
/**
 * Coditron
 *
 * @category  Coditron
 * @package   Coditron_OTPVerification
 * @author    Coditron
 * @copyright Copyright (c) Coditron (https://coditron.com)
 */

namespace Coditron\OTPVerification\Controller\Customer;

use Magento\Framework\App\Action\Action;
use Magento\Framework\App\Action\Context;
use Magento\Framework\Controller\Result\JsonFactory as ResultJsonFactory;
use Magento\Framework\Exception\LocalizedException;
use Magento\Framework\Serialize\SerializerInterface as Serialize;
use Coditron\OTPVerification\Helper\Customer as CustomerHelper;
use Coditron\OTPVerification\Helper\Data as OtpHelper;
use Coditron\OTPVerification\Helper\FormKey\Validator as FormKeyValidator;

class ValidateCustomerCredentials extends Action
{
    /**
     * @var FormKeyValidator
     */
    private $formKeyValidator;

    /**
     * @var JsonFactory
     */
    private $resultJsonFactory;

    /**
     * @var $customerHelper
     */
    private $customerHelper;

    /**
     * @var OtpHelper
     */
    private $otpHelper;

    /**
     * @var Serialize
     */
    private $serialize;

    /**
     * @param FormKeyValidator $formKeyValidator
     * @param ResultJsonFactory $resultJsonFactory
     * @param CustomerHelper $customerHelper
     * @param OtpHelper $otpHelper
     * @param Serialize $serialize
     * @param Context $context
     */
    public function __construct(
        FormKeyValidator $formKeyValidator,
        ResultJsonFactory $resultJsonFactory,
        CustomerHelper $customerHelper,
        OtpHelper $otpHelper,
        Serialize $serialize,
        Context $context
    ) {
        $this->formKeyValidator = $formKeyValidator;
        $this->resultJsonFactory = $resultJsonFactory;
        $this->customerHelper = $customerHelper;
        $this->otpHelper = $otpHelper;
        $this->serialize = $serialize;

        parent::__construct($context);
    }
    
    /**
     * Execute function for validating the customer credentials.
     *
     * @return \Coditron\OTPVerification\Controller\Customer\JsonFactory
     */
    public function execute()
    {
        $credentials = null;
        $response = [
            'error' => true,
            'message' => __('Bad Request.'),
        ];
        try {
            $credentials = $this->serialize->unserialize($this->getRequest()->getContent());
            if (!$credentials ||
                !$this->getRequest()->getMethod() === 'POST' ||
                !$this->getRequest()->isXmlHttpRequest() ||
                !$this->formKeyValidator->validate($this->getRequest())
            ) {
                throw new LocalizedException(__('Bad Request'));
            }
        } catch (\Exception $e) {
            return $this->resultJsonFactory->create()->setData($response);
        }

        $credentials = $this->formatCredentials($credentials);
        if (!isset($credentials['username'], $credentials['password'])) {
            return $this->resultJsonFactory->create()->setData($response);
        }
        $customerData = $this->customerHelper->getCustomerDataByCredentials(
            $credentials['username'],
            $credentials['password']
        );
        if (empty($customerData)) {
            $response = [
                'error' => true,
                'message' => __('The account sign-in was incorrect or your account is disabled temporarily. ').
                __('Please wait and try again later.'),
            ];
            
        } else {
            $response = [
                'error' => false,
                'message' => __('Validation Successful'),
            ];
            $customer = $customerData['customer'];
            $customerAddress = $customerData['customerAddress'];
            $response['data']['medium'] = $customerData['medium'];
            $response['data']['email'] = $customer->getEmail();
            $response['data']['firstname'] = $customer->getFirstname();
            $response['data']['customerData'] = $customer->getData();
            if ($customerAddress) {
                $response['data']['telephone'] = $customerAddress->getTelephone();
                $callingCode = '+' . $this->otpHelper->getCallingCodeByCountryCode($customerAddress->getCountryId());
                $response['data']['callingCode'] = $callingCode;
                $response['data']['telehoneWithCountryCode'] = $this->customerHelper
                    ->getTelephoneWithCallingCode(
                        $callingCode,
                        $customerAddress->getTelephone()
                    );
                $response['data']['countryId'] = $customerAddress->getCountryId();
                $response['data']['customerAddressData'] = $customerAddress->getData();
            }
        }

        return $this->resultJsonFactory->create()->setData($response);
    }

    /**
     * Format Credentials
     *
     * @param array $credentials
     * @return array
     */
    private function formatCredentials($credentials): array
    {
        if (isset($credentials['username'], $credentials['password'], $credentials['form_key'])) {
            return $credentials;
        }
        $formattedCredentials = [];
        foreach ($credentials as $credential) {
            if (isset($credential['name'], $credential['value'])) {
                $formattedCredentials[$credential['name']] = $credential['value'];
            }
        }
        return empty($formattedCredentials) ? $credentials : $formattedCredentials;
    }
}