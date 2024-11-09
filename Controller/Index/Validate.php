<?php
/**
 * Coditron
 *
 * @category  Coditron
 * @package   Coditron_OTPVerification
 * @author    Coditron
 * @copyright Copyright (c) Coditron (https://coditron.com)
 */

namespace Coditron\OTPVerification\Controller\Index;

use Magento\Framework\App\Action\Action;
use Magento\Framework\App\Action\Context;
use Coditron\OTPVerification\Api\OtpRepositoryInterface;

class Validate extends Action
{
    /**
     * @var \Coditron\OTPVerification\Helper\FormKey\Validator $formKeyValidator
     */
    private $formKeyValidator;

    /**
     * @var \Magento\Framework\Controller\Result\JsonFactory
     */
    private $resultJson;

    /**
     * @var OtpRepositoryInterface
     */
    private $otpRepositoryInterface;

    /**
     * @var \Psr\Log\LoggerInterface
     */
    private $_logger;

    /**
     * @var \Coditron\OTPVerification\Helper\Data
     */
    private $helper;

    /**
     * @param \Coditron\OTPVerification\Helper\FormKey\Validator $formKeyValidator
     * @param \Magento\Framework\Controller\Result\JsonFactory $resultJson
     * @param OtpRepositoryInterface $otpRepositoryInterface
     * @param \Coditron\OTPVerification\Helper\Data $helper
     * @param Context $context
     */
    public function __construct(
        \Coditron\OTPVerification\Helper\FormKey\Validator $formKeyValidator,
        \Magento\Framework\Controller\Result\JsonFactory $resultJson,
        OtpRepositoryInterface $otpRepositoryInterface,
        \Coditron\OTPVerification\Helper\Data $helper,
        Context $context
    ) {
        $this->formKeyValidator = $formKeyValidator;
        $this->resultJson = $resultJson;
        $this->otpRepositoryInterface = $otpRepositoryInterface;
        $this->helper = $helper;
        parent::__construct($context);
    }

    /**
     * Execute function for validate the Otp from Customers
     *
     * @param none
     * @return mixed
     */
    public function execute()
    {
        if ($this->formKeyValidator->validate($this->getRequest())) {
            $email = $this->getRequest()->getParam('email');
            $otp = $this->getRequest()->getParam('user_otp');
            $otpData = $this->otpRepositoryInterface->getByEmail($email);
            if (is_array($otpData->getData())) {
                $otpCreatedTimestamp = strtotime($otpData->getCreatedAt());
                $currentTimestamp = time();
                $timeDiff = $currentTimestamp - $otpCreatedTimestamp;
                $otpExpiryTime = $this->helper->otpExpiry();
                if ($otpExpiryTime >= 60 && $otpExpiryTime <= 300) {
                    $otpExpiryTime = $otpExpiryTime;
                } else {
                    $otpExpiryTime = 60;
                }
                if ($timeDiff >= $otpExpiryTime) {
                    $result = ['error' => true, 'message' => __('OTP expired.Please resend OTP and try again.')];
                    return $this->resultJson->create()->setData($result);
                }
                if ($otpData->getOtp() == $otp) {
                    $this->otpRepositoryInterface->deleteByEmail($email);
                    $result = ['error' => false, 'message' => __('OTP verified.')];
                    return $this->resultJson->create()->setData($result);
                } else {
                    $result = ['error' => true, 'message' => __('You have entered a wrong code. Please try again.')];
                    return $this->resultJson->create()->setData($result);
                }
            }
            $result = ['error' => true, 'message' => __('Something Went Wrong.')];
            return $this->resultJson->create()->setData($result);
        } else {
            $result = ['error' => true, 'message' => 'Something Went Wrong.'];
            return $this->resultJson->create()->setData($result);
        }
    }
}
