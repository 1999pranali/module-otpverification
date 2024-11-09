<?php
/**
 * Coditron
 *
 * @category  Coditron
 * @package   Coditron_OTPVerification
 * @author    Coditron
 * @copyright Copyright (c) Coditron (https://coditron.com)
 */

namespace Coditron\OTPVerification\Block\Account;

use Magento\Customer\Model\Form;
use Magento\Store\Model\ScopeInterface;

class AuthenticationPopup extends \Magento\Customer\Block\Account\AuthenticationPopup
{
    /**
     * @var \Coditron\OTPVerification\Helper\Data
     */
    private $helper;

    /**
     * @var \Coditron\OTPVerification\Helper\Customer
     */
    private $customerHelper;

    /**
     * Construct
     *
     * @param \Coditron\OTPVerification\Helper\Customer $customerHelper
     * @param \Coditron\OTPVerification\Helper\Data $helper
     * @param \Magento\Framework\View\Element\Template\Context $context
     * @param array $data
     */
    public function __construct(
        \Coditron\OTPVerification\Helper\Customer $customerHelper,
        \Coditron\OTPVerification\Helper\Data $helper,
        \Magento\Framework\View\Element\Template\Context $context,
        array $data = [],
    ) {
        parent::__construct($context, $data);
        $this->helper = $helper;
        $this->customerHelper = $customerHelper;
    }

    /**
     * Returns popup config
     *
     * @return array
     */
    public function getConfig()
    {
        $usernameType = $this->customerHelper->getCurrentUsernameType();
        $usernameFieldConfig = $this->customerHelper->getLoginUsernameFieldConfigByType($usernameType);
        return [
            'autocomplete' => $this->escapeHtml($this->isAutocompleteEnabled()),
            'customerRegisterUrl' => $this->escapeUrl($this->getCustomerRegisterUrlUrl()),
            'customerForgotPasswordUrl' => $this->escapeUrl($this->getCustomerForgotPasswordUrl()),
            'baseUrl' => $this->escapeUrl($this->getBaseUrl()),
            'customerLoginUrl' => $this->getUrl('customer/ajax/login'),
            'otp' => $this->helper->getOtpModalConfig(),
            'usernameFieldConfig' => $usernameFieldConfig,
            'otpModalComponent' => ['Coditron_OTPVerification/js/login' => $this->helper->getOtpModalConfig()]
        ];
    }

    /**
     * Is autocomplete enabled for storefront
     *
     * @return string
     */
    private function isAutocompleteEnabled()
    {
        return $this->_scopeConfig->getValue(
            Form::XML_PATH_ENABLE_AUTOCOMPLETE,
            ScopeInterface::SCOPE_STORE
        ) ? 'on' : 'off';
    }
}
