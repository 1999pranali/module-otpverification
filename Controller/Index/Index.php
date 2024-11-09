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
use Coditron\OTPVerification\Api\Data\OtpInterface;
use Coditron\OTPVerification\Api\OtpRepositoryInterface;

class Index extends Action
{
    public const XML_PATH_OTP_EMAIL = 'otp_login/emailsettings/otp_notification';
    public const XML_PATH_OTP_EMAIL_LOGIN = 'otp_login/emailsettings/otp_notification_at_login';
    public const XML_PATH_OTP_EMAIL_FORGET_PASSWORD = 'otp_login/emailsettings/otp_notification_at_forget_password';

    /**
     * @var \Coditron\OTPVerification\Helper\FormKey\Validator $formKeyValidator
     */
    private $formKeyValidator;

    /**
     * @var Magento\Framework\App\Config\ScopeConfigInterface
     */
    private $scopeConfig;

    /**
     * @var \Magento\Store\Model\StoreManagerInterface
     */
    private $storeManager;

    /**
     * @var \Magento\Framework\Mail\Template\TransportBuilder
     */
    private $transportBuilder;

    /**
     * @var \Magento\Framework\Translate\Inline\StateInterface
     */
    private $inlineTranslation;

    /**
     * @var \Magento\Framework\Controller\Result\JsonFactory
     */
    private $resultJson;

    /**
     * @var OtpRepositoryInterface
     */
    private $otpRepositoryInterface;

    /**
     * @var OtpInterface
     */
    private $otpInterface;

    /**
     * @var Helper
     */
    protected $helper;

    /**
     * @var \Magento\Framework\Serialize\SerializerInterface
     */
    private $serialize;
    
    /**
     * @var \Magento\Customer\Model\CustomerFactory
     */
    private $customerFactory;
    
    /**
     * @var \Magento\Customer\Model\Session
     */
    private $customerSession;

    /**
     * @var \Magento\Framework\Stdlib\DateTime\DateTime
     */
    private $date;

    /**
     * @var \Magento\Customer\Model\ResourceModel\Customer\CollectionFactory
     */
    private $customerCollectionFactory;

    /**
     * @var string
     */
    private $template;

    /**
     * @param \Magento\Framework\Translate\Inline\StateInterface $inlineTranslation
     * @param \Magento\Framework\Mail\Template\TransportBuilder $transportBuilder
     * @param \Coditron\OTPVerification\Helper\FormKey\Validator $formKeyValidator
     * @param \Magento\Framework\App\Config\ScopeConfigInterface $scopeConfig
     * @param \Magento\Framework\Controller\Result\JsonFactory $resultJson
     * @param \Magento\Store\Model\StoreManagerInterface $storeManager
     * @param \Magento\Customer\Model\CustomerFactory $customerFactory
     * @param \Magento\Customer\Model\Session $customerSession
     * @param \Coditron\OTPVerification\Helper\Data $helper
     * @param OtpRepositoryInterface $otpRepositoryInterface
     * @param OtpInterface $otpInterface
     * @param \Magento\Framework\Stdlib\DateTime\DateTime $date
     * @param \Magento\Framework\Serialize\SerializerInterface $serialize
     * @param \Magento\Customer\Model\ResourceModel\Customer\CollectionFactory $customerCollectionFactory
     * @param Context $context
     */
    public function __construct(
        \Magento\Framework\Translate\Inline\StateInterface $inlineTranslation,
        \Magento\Framework\Mail\Template\TransportBuilder $transportBuilder,
        \Coditron\OTPVerification\Helper\FormKey\Validator $formKeyValidator,
        \Magento\Framework\App\Config\ScopeConfigInterface $scopeConfig,
        \Magento\Framework\Controller\Result\JsonFactory $resultJson,
        \Magento\Store\Model\StoreManagerInterface $storeManager,
        \Magento\Customer\Model\CustomerFactory $customerFactory,
        \Magento\Customer\Model\Session $customerSession,
        \Coditron\OTPVerification\Helper\Data $helper,
        OtpRepositoryInterface $otpRepositoryInterface,
        OtpInterface $otpInterface,
        \Magento\Framework\Stdlib\DateTime\DateTime $date,
        \Magento\Framework\Serialize\SerializerInterface $serialize,
        \Magento\Customer\Model\ResourceModel\Customer\CollectionFactory $customerCollectionFactory,
        Context $context
    ) {
        $this->inlineTranslation = $inlineTranslation;
        $this->transportBuilder = $transportBuilder;
        $this->formKeyValidator = $formKeyValidator;
        $this->scopeConfig = $scopeConfig;
        $this->resultJson = $resultJson;
        $this->storeManager = $storeManager;
        $this->customerFactory = $customerFactory;
        $this->customerSession = $customerSession;
        $this->helper = $helper;
        $this->otpRepositoryInterface = $otpRepositoryInterface;
        $this->otpInterface = $otpInterface;
        $this->date = $date;
        $this->serialize = $serialize;
        $this->customerCollectionFactory = $customerCollectionFactory;
        parent::__construct($context);
    }

    /**
     * Function execute for Controller
     *
     * @return Json result
     */
    public function execute()
    {
        if ($this->formKeyValidator->validate($this->getRequest()) && $this->helper->isModuleEnable()) {
            $requestData = $this->getRequest()->getParams()
            ?: $this->serialize->unserialize($this->getRequest()->getContent());
            $name = $requestData['name'] ?? null;
            $email = $requestData['email'] ?? null;
            $resend = $requestData['resend'] ?? null;
            $mobile = $requestData['mobile'] ?? null;
            $regionId = $requestData['region'] ?? null;
            $shouldCheckExistingAccount = isset($requestData['shouldCheckExistingAccount'])
            ? (int) $requestData['shouldCheckExistingAccount'] : 1;
            $forgetPassword = false;
            if (isset($requestData['forgetpassword'])) {
                $forgetPassword = $requestData['forgetpassword'];
            }
            if (!$this->isCheckout() && $shouldCheckExistingAccount) {
                $accountExists = $this->checkExistingAccount($email);
                if ($accountExists) {
                    $result = [
                        'error' => true,
                        'message' => __("An account already exits with this email."),
                        'errorCode' => "account_exist",
                    ];
                    //$this->messageManager->addErrorMessage(__('An account already exists with this email.'));
                    return $this->resultJson->create()->setData($result);
                }

                // $checkIfPhoneNumberExist = $this->customerCollectionFactory->create()
                //     ->addAttributeToFilter('default_phone_number', ['eq' => $mobile]);

                // if (!empty($checkIfPhoneNumberExist->getData())) {
                //     $result = [
                //         'error' => true,
                //         'message' => __("Phone number already exist"),

                //     ];
                //     return $this->resultJson->create()->setData($result);
                // }
            }
            $password = rand(100000, 999999);
            $collection = $this->otpRepositoryInterface->getByEmail($email);
            $date = $this->date->gmtDate();
            if ($mobile!=null) {
                $mobile = str_replace(" ", "", $mobile);
            }
            $callingCode = empty($regionId)
            ? ''
            : ('+' . $this->helper->getCallingCodeByCountryCode($regionId));
            $mobile = !empty($mobile) && !empty($callingCode) &&
            substr($mobile, 0, 1) !== '+'
            ? $callingCode . $mobile
            : $mobile;
            if (!$this->customerSession->getCustomer()->getGroupId()) {
                if (empty($email)) {
                    $email = $this->customerSession->getCustomer()->getEmail();
                }
                if (empty($mobile)) {
                    $regionId = $this->customerSession->getCustomer()->getPrimaryBillingAddress()->getCountryId();
                    $callingCode = '+' . $this->helper->getCallingCodeByCountryCode($regionId);
                    $mobile = $callingCode . $this->customerSession
                        ->getCustomer()->getPrimaryBillingAddress()
                        ->getTelephone();
                }
            }
            if (is_array($collection->getData())) {
                $collection->setEmail($email);
                $collection->setOtp($password);
                $collection->setCreatedAt($date);
                $collection->save($collection);
            } else {
                $this->otpInterface->setEmail($email);
                $this->otpInterface->setOtp($password);
                $this->otpRepositoryInterface->save($this->otpInterface);
            }

            $sendOtpVia = $this->helper->sendOtpVia();
            $forOthersSendOtpVia = $this->helper->forOthersSendOtpVia();

            if ($forOthersSendOtpVia == 'both' || $forOthersSendOtpVia == 'email' || $sendOtpVia == 'email') {
                if (!empty($email)) {
                    $response = $this->sendOTPToEmail($email, $name, $password, $forgetPassword);
                    $otpMedium = 'Email ID';
                }
            }

            if ($response['error']) {
                $errorMessage = $response['message'] ?? "";

                if ($otpMedium == "Email ID") {
                    if ($errorMessage == 'Unable to send mail') {
                        $result = ['error' => true, 'message' =>
                        __("Unable to send mail"), 'errorCode' => "exception"];
                        return $this->resultJson->create()->setData($result);
                    }
                }

                if (strpos($errorMessage, 'Unable to send mail') === false) {

                    $result = ['otpMedium'=>$otpMedium,
                    'rerrorMessage'=>$response['message'],
                    'error' => true,
                    'message' => __("Unable to send mail or verify your twilio sender number"),
                    'errorCode' => "exception"];
                    return $this->resultJson->create()->setData($result);
                } elseif (strpos($errorMessage, 'unverified numbers') === false) {
                    $result = ['error' => true, 'message' => __("The phone number %1 is not verified.", $mobile)
                    , 'errorCode' => "exception"];
                    return $this->resultJson->create()->setData($result);
                } else {

                    $result = ['error' => true, 'message' => __("Unable to send OTP.
                    Please try again later."), 'errorCode' => "exception"];
                    return $this->resultJson->create()->setData($result);
                }
            } else {
                $successMessage = $resend
                ? __("A new OTP has been sent to your registered %1. Please enter the OTP.", $otpMedium)
                : __("Please Enter the OTP sent to your registered %1", $otpMedium);
                $result = ['error' => false, 'message' => $successMessage];
                return $this->resultJson->create()->setData($result);
            }
        } else {
            $this->messageManager->addError(__("Something Went Wrong."));
            $result = ['error' => true, 'message' => __("Something Went Wrong."), 'errorCode' => "exception"];
            return $this->resultJson->create()->setData($result);
        }
    }

    /**
     * Function to send One time password on email
     *
     * @param string $email
     * @param string $name
     * @param integer $password
     * @param bool $forgetPassword
     * @return array
     */
    private function sendOTPToEmail($email, $name, $password, $forgetPassword = false)
    {
        $emailTempVariables = [];
        $senderInfo = [];
        $receiverInfo = [];
        $storeScope = \Magento\Store\Model\ScopeInterface::SCOPE_STORE;
        $senderEmail = $this->scopeConfig->getValue('trans_email/ident_support/email', $storeScope);
      
        $senderName = $this->scopeConfig->getValue('trans_email/ident_support/name', $storeScope);
        $emailTempVariables['password'] = $password;
        $senderInfo['email'] = $senderEmail;
        $senderInfo['name'] = $senderName;
        $receiverInfo['email'] = $email;
        if (!empty($name)) {
            $receiverInfo['name'] = $name;
            $emailTempVariables['name'] = $name;
        } else {
            $receiverInfo['name'] = "Buyer";
            $emailTempVariables['name'] = "Buyer";
        }
        $emailTempVariables['time_to_expire'] = $this->helper->getOtpTimeToExpireString();
        try {
            $this->template = $this->getTemplateId(self::XML_PATH_OTP_EMAIL_LOGIN);
            if ($this->getRequest()->getParam('registration')) {
                $this->template = $this->getTemplateId(self::XML_PATH_OTP_EMAIL);
            } elseif ($forgetPassword) {
                $this->template = $this->getTemplateId(self::XML_PATH_OTP_EMAIL_FORGET_PASSWORD);
            }
            $this->inlineTranslation->suspend();
            $this->generateTemplate($emailTempVariables, $senderInfo, $receiverInfo);
            $transport = $this->transportBuilder->getTransport();
            $transport->sendMessage();
            $this->inlineTranslation->resume();
            $result = ['error' => false, 'message' => 'Successfully sent'];
        } catch (\Exception $e) {
            $message = $e->getMessage();
            $message = substr($message, (strpos($message, ":") ?: -2) + 2);
            $result = ['error' => true, 'message' => "Unable to send mail"];
        }

        return $result;
    }

    /**
     * Function to check for checkout process
     *
     * @return bool
     */
    private function isCheckout()
    {
        return $this->getRequest()->getParam('checkout');
    }

    /**
     * Generate Template description.
     *
     * @param Mixed $emailTemplateVariables
     * @param Mixed $senderInfo
     * @param Mixed $receiverInfo
     */
    private function generateTemplate($emailTemplateVariables, $senderInfo, $receiverInfo)
    {
        $this->transportBuilder
            ->setTemplateIdentifier($this->template)
            ->setTemplateOptions(
                [
                    'area' => \Magento\Framework\App\Area::AREA_FRONTEND,
                    'store' => $this->storeManager->getStore()->getId(),
                ]
            )
            ->setTemplateVars($emailTemplateVariables)
            ->setFrom($senderInfo)
            ->addTo($receiverInfo['email'], $receiverInfo['name']);
        return $this;
    }

    /**
     * Return template id.
     *
     * @param string $xmlPath
     *
     * @return mixed
     */
    private function getTemplateId($xmlPath)
    {
        return $this->getConfigValue($xmlPath, $this->getStore()->getStoreId());
    }

    /**
     * Return store configuration value.
     *
     * @param string $path
     * @param int $storeId
     *
     * @return mixed
     */
    private function getConfigValue($path, $storeId)
    {
        return $this->scopeConfig->getValue(
            $path,
            \Magento\Store\Model\ScopeInterface::SCOPE_STORE,
            $storeId
        );
    }

    /**
     * Function to check if an already exists with email provided by customer
     *
     * @param string $email email
     *
     * @return bool
     */
    private function checkExistingAccount($email)
    {
        $accountExists = $this->customerFactory->create()->getCollection()
            ->addFieldToFilter('email', ['eq' => $email])
            ->getSize();
        if ($accountExists > 0) {
            return true;
        } else {
            return false;
        }
    }

    /**
     * Return store.
     *
     * @return \Magento\Store\Api\Data\StoreInterface
     */
    private function getStore()
    {
        return $this->storeManager->getStore();
    }
}
