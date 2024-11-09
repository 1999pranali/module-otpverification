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
use Coditron\OTPVerification\Api\OtpRepositoryInterface as OtpRepository;
use Coditron\OTPVerification\Helper\Customer as CustomerHelper;
use Coditron\OTPVerification\Helper\Data as OtpHelper;
use Coditron\OTPVerification\Helper\FormKey\Validator as FormKeyValidator;

class ValidateCustomerOtp extends Action
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
     * @var OtpRepository
     */
    private $otpRepository;

    /**
     * @param FormKeyValidator $formKeyValidator
     * @param ResultJsonFactory $resultJsonFactory
     * @param CustomerHelper $customerHelper
     * @param OtpHelper $otpHelper
     * @param Serialize $serialize
     * @param OtpRepository $otpRepository
     * @param Context $context
     */
    public function __construct(
        FormKeyValidator $formKeyValidator,
        ResultJsonFactory $resultJsonFactory,
        CustomerHelper $customerHelper,
        OtpHelper $otpHelper,
        Serialize $serialize,
        OtpRepository $otpRepository,
        Context $context
    ) {
        $this->formKeyValidator = $formKeyValidator;
        $this->resultJsonFactory = $resultJsonFactory;
        $this->customerHelper = $customerHelper;
        $this->otpHelper = $otpHelper;
        $this->serialize = $serialize;
        $this->otpRepository = $otpRepository;

        parent::__construct($context);
    }

    /**
     * Execute function for validating the customer otp.
     *
     * @return \Coditron\OTPVerification\Controller\Customer\JsonFactory
     */
    public function execute()
    {
        $response = [
            'error' => true,
            'message' => __('Bad Request.'),
        ];
        $otpCredentials = false;
        try {
            $otpCredentials = $this->serialize->unserialize($this->getRequest()->getContent());
            if (!$otpCredentials ||
                !$this->getRequest()->getMethod() === 'POST' ||
                !$this->getRequest()->isXmlHttpRequest() ||
                !$this->formKeyValidator->validate($this->getRequest())
            ) {
                throw new LocalizedException('Bad Request');
            }
        } catch (\Exception $e) {
            return $this->resultJsonFactory->create()->setData($response);
        }
        $otpData = $this->otpRepository->getByEmail($otpCredentials['email']);
        if (is_array($otpData->getData())) {
            $otpCreatedTimestamp = strtotime($otpData->getCreatedAt());
            $currentTimestamp = time();
            $timeDiff = $currentTimestamp - $otpCreatedTimestamp;
            $otpExpiryTime = $this->otpHelper->otpExpiry();
            if ($otpExpiryTime >= 60 && $otpExpiryTime <= 300) {
                $otpExpiryTime = $otpExpiryTime;
            } else {
                $otpExpiryTime = 60;
            }
            if ($timeDiff >= $otpExpiryTime) {
                $response = ['error' => true, 'message' => __('OTP expired. Please resend OTP and try again.')];
                $this->customerHelper->processAuthenticationFailure($otpCredentials['email']);
                return $this->resultJsonFactory->create()->setData($response);
            }
            if ($otpData->getOtp() == $otpCredentials['otp']) {
                $this->otpRepository->deleteByEmail($otpCredentials['email']);
                $response = ['error' => false, 'message' => __('OTP verified.')];
                return $this->resultJsonFactory->create()->setData($response);
            } else {
                $this->customerHelper->processAuthenticationFailure($otpCredentials['email']);
                $response = ['error' => true, 'message' => __('You have entered a wrong code. Please try again.')];
                return $this->resultJsonFactory->create()->setData($response);
            }
        }
    }
}
