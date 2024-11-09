<?php
/**
 * Coditron
 *
 * @category  Coditron
 * @package   Coditron_OTPVerification
 * @author    Coditron
 * @copyright Copyright (c) Coditron (https://coditron.com)
 */

namespace Coditron\OTPVerification\Model;

class AdditionalConfigProvider implements \Magento\Checkout\Model\ConfigProviderInterface
{
    /**
     * @var \Coditron\OTPVerification\Helper\Data
     */
    protected $_helper;
    
    /**
     * @param \Coditron\OTPVerification\Helper\Data $helper
     */
    public function __construct(
        \Coditron\OTPVerification\Helper\Data $helper
    ) {
        $this->_helper = $helper;
    }

    /**
     * Function to set additonal parameter in window coonfig provider on checkout page.
     *
     * @return array
     */
    public function getConfig()
    {
        $output['is_onestepcheckout_enabled'] = $this->_helper->isOneStepCheckoutEnable();
        $output['is_module_enabled'] = $this->_helper->isModuleEnable();
        $output['validateNumberError'] = __("Please enter a valid number.");
        $output['allowed_payment_methods'] = $this->_helper->getAllowedPaymentMethods();
        return $output;
    }
}
