<?php
/**
 * Coditron
 *
 * @category  Coditron
 * @package   Coditron_OTPVerification
 * @author    Coditron
 * @copyright Copyright (c) Coditron (https://coditron.com)
 */

namespace Coditron\OTPVerification\Api\Data;

interface OtpInterface
{
    /**
     * Constants for keys of data array. Identical to the name of the getter in snake case
     */
    public const ENTITY_ID = 'entity_id';

    public const EMAIL = 'email';

    public const OTP = 'otp';

    public const CREATED_AT = 'created_at';

    /**
     * Get ID
     *
     * @return int|null
     */
    public function getId();

    /**
     * Set ID
     *
     * @param int $id
     * @return int $id
     */
    public function setId($id);

    /**
     * Get Email
     *
     * @return string|null
     */
    public function getEmail();

    /**
     * Set Email
     *
     * @param string $email
     * @return int $id
     */
    public function setEmail($email);

    /**
     * Get Otp
     *
     * @return int|null
     */
    public function getOtp();

    /**
     * Set Otp
     *
     * @param int $otp
     * @return int $otp
     */
    public function setOtp($otp);

    /**
     * Set CreatedAt
     *
     * @param int $created_at
     * @return date
     */
    public function setCreatedAt($created_at);

    /**
     * Get CreatedAt
     *
     * @return date
     */
    public function getCreatedAt();
}
