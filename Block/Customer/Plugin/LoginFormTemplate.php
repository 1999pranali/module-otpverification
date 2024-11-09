<?php
/**
 * Coditron
 *
 * @category  Coditron
 * @package   Coditron_OTPVerification
 * @author    Coditron
 * @copyright Copyright (c) Coditron (https://coditron.com)
 */

namespace Coditron\OTPVerification\Block\Customer\Plugin;

use Coditron\OTPVerification\Helper\Data as OtpHelper;

class LoginFormTemplate
{
    /**
     * @var OtpHelper
     */
    private $otpHelper;

    /**
     * @param OtpHelper $otpHelper
     */
    public function __construct(OtpHelper $otpHelper)
    {
        
        $this->otpHelper = $otpHelper;
    }

    /**
     * Get Template based on module configuration
     *
     * @param \Magento\Customer\Block\Form\Login $subject
     * @param string $result
     * @return string
     */
    public function afterGetTemplate(
        \Magento\Customer\Block\Form\Login $subject,
        $result
    ) {
        return $this->otpHelper->isModuleEnable() ? 'Coditron_OTPVerification::form/login.phtml' : $result;
    }
}
