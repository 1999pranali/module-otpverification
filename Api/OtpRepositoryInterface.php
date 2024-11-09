<?php
/**
 * Coditron
 *
 * @category  Coditron
 * @package   Coditron_OTPVerification
 * @author    Coditron
 * @copyright Copyright (c) Coditron (https://coditron.com)
 */

namespace Coditron\OTPVerification\Api;

/**
 * @api
 */
interface OtpRepositoryInterface
{
    /**
     * Save Otp.
     *
     * @param \Coditron\OTPVerification\Api\Data\OtpInterface $otp
     * @return \Coditron\OTPVerification\Api\Data\OtpInterface
     * @throws \Magento\Framework\Exception\LocalizedException
     */
    public function save(\Coditron\OTPVerification\Api\Data\OtpInterface $otp);

    /**
     * Retrieve Otp.
     *
     * @param string $customerEmail
     * @return \Coditron\OTPVerification\Api\Data\OtpInterface
     * @throws \Magento\Framework\Exception\LocalizedException
     */
    public function getByEmail($customerEmail);

    /**
     * Delete Otp Data.
     *
     * @param string $customerEmail
     * @return bool true on success
     * @throws \Magento\Framework\Exception\LocalizedException
     */
    public function deleteByEmail($customerEmail);
}
