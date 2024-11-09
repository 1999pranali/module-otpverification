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
use Coditron\OTPVerification\Helper\Customer as CustomerHelper;
use Coditron\OTPVerification\Helper\Data as OtpHelper;
use Coditron\OTPVerification\Helper\FormKey\Validator as FormKeyValidator;

class LoginConfig extends Action
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
     * @param FormKeyValidator $formKeyValidator
     * @param ResultJsonFactory $resultJsonFactory
     * @param CustomerHelper $customerHelper
     * @param OtpHelper $otpHelper
     * @param Context $context
     */
    public function __construct(
        FormKeyValidator $formKeyValidator,
        ResultJsonFactory $resultJsonFactory,
        CustomerHelper $customerHelper,
        OtpHelper $otpHelper,
        Context $context
    ) {
        $this->formKeyValidator = $formKeyValidator;
        $this->resultJsonFactory = $resultJsonFactory;
        $this->customerHelper = $customerHelper;
        $this->otpHelper = $otpHelper;

        parent::__construct($context);
    }

    /**
     * Returns login configration for checkout loging widget.
     *
     * @return \Coditron\OTPVerification\Controller\Customer\JsonFactory
     */
    public function execute()
    {
        $response = [
            'error' => true,
            'message' => __('Bad Request.'),
        ];
        if (!$this->getRequest()->getMethod() === 'POST' ||
            !$this->getRequest()->isXmlHttpRequest() ||
            !$this->formKeyValidator->validate($this->getRequest())
        ) {
            return $this->resultJsonFactory->create()->setData($response);
        }
        $otpModalConfig = $this->otpHelper->getOtpModalConfig();
        $usernameType = $this->customerHelper->getCurrentUsernameType();
        $usernameFieldConfig = $this->customerHelper->getLoginUsernameFieldConfigByType($usernameType);
        if ($this->otpHelper->isModuleEnable() && $this->otpHelper->isEnableAtLogin()) {
            $loginConfig['otpModalComponent'] = ['Coditron_OTPVerification/js/login' => $otpModalConfig];
        }
        $loginConfig['usernameFieldConfig'] = $usernameFieldConfig;
        $response = ['error' => false, 'message' => __('Success'), 'data' => $loginConfig];
        return $this->resultJsonFactory->create()->setData($response);
    }
}
