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

use Magento\Framework\Exception\CouldNotDeleteException;
use Magento\Framework\Exception\CouldNotSaveException;
use Coditron\OTPVerification\Api\OtpRepositoryInterface;

class OtpRepository implements OtpRepositoryInterface
{
    /**
     * @var Otp
     */
    private $otpModel;

    /**
     * Construct
     *
     * @param Otp $otpModel
     */
    public function __construct(
        Otp $otpModel
    ) {
        $this->otpModel = $otpModel;
    }

    /**
     * Save Function
     *
     * @param \Coditron\OTPVerification\Api\Data\OtpInterface $otp
     *
     * @throws CouldNotSaveException
     */
    public function save(\Coditron\OTPVerification\Api\Data\OtpInterface $otp)
    {
        try {
            $this->otpModel->save($otp);
        } catch (\Exception $e) {
            throw new CouldNotSaveException(
                __('Could not save the page: %1', $e->getMessage()),
                $e
            );
        }
    }

    /**
     * GetByEmail
     *
     * @param String $customerEmail
     *
     * @return \Coditron\OTPVerification\Model\Otp
     *
     * @throws couldnotdeleteException
     */
    public function getByEmail($customerEmail)
    {
        return $this->otpModel->load($customerEmail, 'email');
    }

    /**
     * DeleteByEmail
     *
     * @param string $customerEmail
     *
     * @throws couldnotdeleteException
     */
    public function deleteByEmail($customerEmail)
    {
        try {
            $collection = $this->getByEmail($customerEmail);
            $collection->delete();
        } catch (\Exception $e) {
            throw new CouldNotDeleteException(
                __('Could not save the page: %1', $e->getMessage()),
                $e
            );
        }
    }
}
