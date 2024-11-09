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

use Coditron\OTPVerification\Helper\Customer as CustomerHelper;
use Coditron\OTPVerification\Helper\Data as OtpHelper;

class PhoneNumberToEmailConverter
{
    /**
     * @var CustomerHelper
     */
    private $customerHelper;

    /**
     * @var OtpHelper
     */
    private $otpHelper;

    /**
     * @param CustomerHelper $customerHelper
     * @param OtpHelper $otpHelper
     */
    public function __construct(
        CustomerHelper $customerHelper,
        OtpHelper $otpHelper
    ) {
        $this->customerHelper = $customerHelper;
        $this->otpHelper = $otpHelper;
    }

    /**
     * Check and converts username from phonenumber into email address
     *
     * @param \Magento\Customer\Api\AccountManagementInterface $subject
     * @param string $email
     * @param string $password
     * @return array
     */
    public function beforeAuthenticate(
        \Magento\Customer\Api\AccountManagementInterface $subject,
        $email,
        $password
    ) {
        if ($this->otpHelper->isModuleEnable()
            && CustomerHelper::USERNAME_EMAIL !== $this->customerHelper->getCurrentUsernameType()
        ) {
            $email = $this->customerHelper->isEmail($email)
            ? $email
            : (
                ($customer = $this->customerHelper->getCustomerDataByPhoneNumber($email, $password)['customer'])
                ? $customer->getEmail()
                : $email
            );
        }

        return [$email, $password];
    }
}
