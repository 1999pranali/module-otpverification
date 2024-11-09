<?php
/**
 * Coditron
 *
 * @category  Coditron
 * @package   Coditron_OTPVerification
 * @author    Coditron
 * @copyright Copyright (c) Coditron (https://coditron.com)
 */

namespace Coditron\OTPVerification\Helper;

use Magento\Customer\Api\CustomerRepositoryInterface;
use Magento\Customer\Model\Address\CustomerAddressDataProvider;
use Magento\Framework\App\Helper\AbstractHelper;
use \Magento\Framework\Serialize\SerializerInterface as Serialize;
use Magento\Framework\Url;
use Magento\Framework\View\Asset\Repository as AssetRepository;
use Magento\Payment\Model\Config;

/**
 * Otp data helper
 */
class Data extends AbstractHelper
{
    public const XML_PATH_MODULE_ENABLE = 'otp_login/generalsettings/otp_enable';
    public const XML_PATH_ONESTEPCHECKOUT_ENABLE = 'opc/general_settings/active';
    public const XML_PATH_MODULE_ENABLE_REGISTRATION = 'otp_login/generalsettings/otp_enable_registration';
    public const XML_PATH_MODULE_ENABLE_LOGIN = 'otp_login/generalsettings/otp_enable_login';
    public const XML_PATH_REGISTRATION_EMAIL = 'otp_login/emailsettings/otp_notification';
    public const XML_PATH_MODULE_ENABLED_FORGOT_PASSWORD = 'otp_login/generalsettings/forgot_password';
    public const OTP_EXPIRY = 'otp_login/generalsettings/expiry';
    public const FOR_CREATE_ACCOUNT_SEND_OTP_VIA = 'otp_login/generalsettings/send_otp_via';
    public const FOR_OTHERS_SEND_OTP_VIA = 'otp_login/generalsettings/send_otp_via_for_others';

    /**
     * @var \Coditron\BookingSmsNotification\Encryption\EncryptorInterface
     */
    private $enc;

    /**
     * @var \Magento\Store\Model\StoreManagerInterface
     */
    private $storeManager;

    /**
     * @var  \Magento\Framework\App\Config\ScopeConfigInterface
     */
    protected $scopeConfig;

    /**
     * @var \Magento\Payment\Helper\Data
     */
    private $paymentHelper;

    /**
     * @var \Magento\Customer\Api\CustomerRepositoryInterface
     */
    private $customerRepository;

    /**
     * @var \Magento\Customer\Model\Address\CustomerAddressDataProvider
     */
    private $customerAddressData;

    /**
     * @var \Magento\Framework\Url
     */
    private $urlModel;

    /**
     * @var \Magento\Framework\View\Asset\Repository
     */
    private $assetRepository;

    /**
     * @var Serialize
     */
    private $serialize;
    
    /**
     * @var \Magento\Framework\Filesystem\Driver\Http
     */
    private $driver;

    /**
     * @var \Magento\Customer\Model\Session
     */
    private $customerSession;

    /**
     * @var Config
     */
    private $_paymentModelConfig;
    
    /**
     * @var \Magento\Store\Model\ScopeInterface
     */
    private $storeScope;

    /**
     * @var \Magento\Framework\Module\Manager
     */
    protected $_moduleManager;

    /**
     * Countries cache;
     *
     * @var array
     */
    private $countries;

    /**
     * @param \Magento\Payment\Helper\Data $paymentHelper
     * @param \Magento\Framework\Encryption\EncryptorInterface $enc
     * @param \Magento\Store\Model\StoreManagerInterface $storeManager
     * @param \Magento\Framework\App\Config\ScopeConfigInterface $scopeConfig
     * @param \Magento\Framework\Filesystem\Driver\Http $driver
     * @param \Magento\Customer\Model\Session $customerSession
     * @param Config $paymentModelConfig
     * @param CustomerRepositoryInterface $customerRepository
     * @param CustomerAddressDataProvider $customerAddressData
     * @param Url $urlModel
     * @param AssetRepository $assetRepository
     * @param Serialize $serialize
     * @param \Magento\Framework\Module\Manager $moduleManager
     */
    public function __construct(
        \Magento\Payment\Helper\Data $paymentHelper,
        \Magento\Framework\Encryption\EncryptorInterface $enc,
        \Magento\Store\Model\StoreManagerInterface $storeManager,
        \Magento\Framework\App\Config\ScopeConfigInterface $scopeConfig,
        \Magento\Framework\Filesystem\Driver\Http $driver,
        \Magento\Customer\Model\SessionFactory $customerSession,
        Config $paymentModelConfig,
        CustomerRepositoryInterface $customerRepository,
        CustomerAddressDataProvider $customerAddressData,
        Url $urlModel,
        AssetRepository $assetRepository,
        Serialize $serialize,
        \Magento\Framework\Module\Manager $moduleManager,
        \Magento\Framework\HTTP\Client\Curl $curl,
        \Magento\Framework\Serialize\SerializerInterface $serializeInterface
    ) {
        $this->paymentHelper = $paymentHelper;
        $this->enc = $enc;
        $this->storeManager = $storeManager;
        $this->scopeConfig = $scopeConfig;
        $this->driver = $driver;
        $this->customerSession = $customerSession;
        $this->_paymentModelConfig = $paymentModelConfig;
        $this->customerRepository = $customerRepository;
        $this->customerAddressData = $customerAddressData;
        $this->urlModel = $urlModel;
        $this->assetRepository = $assetRepository;
        $this->serialize = $serialize;
        $this->_moduleManager = $moduleManager;
        $this->storeScope = \Magento\Store\Model\ScopeInterface::SCOPE_STORE;
        $this->curl = $curl;
        $this->serializeInterface = $serializeInterface;
    }

    /**
     * Return store configuration value.
     *
     * @param string $path
     * @param int    $storeId
     * @return mixed
     */
    public function getConfigValue($path, $storeId)
    {
        return $this->scopeConfig->getValue(
            $path,
            \Magento\Store\Model\ScopeInterface::SCOPE_STORE,
            $storeId
        );
    }

    /**
     * GetPaymentMethods
     *
     * @return array
     */
    public function getPaymentMethods()
    {
        return $this->paymentHelper->getPaymentMethods();
    }

    /**
     * Return template id.
     *
     * @param string $xmlPath
     * @return string
     */
    public function getTemplateId($xmlPath)
    {
        return $this->getConfigValue($xmlPath, $this->getStore()->getStoreId());
    }

    /**
     * Function to return status of Module
     *
     * @return bool
     */
    public function isModuleEnable()
    {
        return $this->getConfigValue(self::XML_PATH_MODULE_ENABLE, $this->getStore()->getStoreId());
    }

    /**
     * Function to return status of Module
     *
     * @return bool
     */
    public function isOneStepCheckoutEnable()
    {
        return $this->getConfigValue(self::XML_PATH_ONESTEPCHECKOUT_ENABLE, $this->getStore()->getStoreId());
    }

    /**
     * Function to return status of otp validation at Registration
     *
     * @return bool
     */
    public function isEnableAtRegistration()
    {
        return $this->getConfigValue(self::XML_PATH_MODULE_ENABLE_REGISTRATION, $this->getStore()->getStoreId());
    }

    /**
     * Function to return status of otp validation at Login
     *
     * @return bool
     */
    public function isEnableAtLogin()
    {
        return $this->getConfigValue(self::XML_PATH_MODULE_ENABLE_LOGIN, $this->getStore()->getStoreId());
    }

    /**
     * Function to return status of otp validation at forgot password
     *
     * @return bool
     */
    public function isModuleEnabledAtForgotPassword()
    {
        return $this->getConfigValue(self::XML_PATH_MODULE_ENABLED_FORGOT_PASSWORD, $this->getStore()->getStoreId());
    }

    /**
     * Function to get allowed payment methods from Configuration
     *
     * @return string
     */
    public function getAllowedPaymentMethods()
    {
        return "free";
    }

    /**
     * Return store.
     *
     * @return \Magento\Store\Model\StoreManagerInterface
     */
    public function getStore()
    {
        return $this->storeManager->getStore();
    }

    /**
     * Send the b2bmarketplace module enable
     *
     * @return boolean
     */
    public function isB2BMarketplaceModuleEnable()
    {
        return $this->_moduleManager->isEnabled('Webkul_B2BMarketplace');
    }

    /**
     * Send the marketplace module enable
     *
     * @return boolean
     */
    public function isMarketplaceModuleEnable()
    {
        return $this->_moduleManager->isEnabled('Webkul_Marketplace');
    }

    /**
     * Get countries with calling codes and name
     *
     * @param boolean $refresh
     * @return array
     */
    public function getCountries($refresh = false): array
    {
        if (empty($this->countries) || $refresh) {
            try {
                $url = 'https://restcountries.com/v2/all?fields=name,callingCodes';
                // $countriesData = $this->driver->fileGetContents($url);
                // $countriesData = $this->serialize->unserialize($countriesData);
                $curl = new \Magento\Framework\HTTP\Client\Curl();
                $curl->get($url);
                $response = $curl->getBody();
                $countriesData = $this->serializeInterface->unserialize($response);
            } catch (\Exception $exception) {
                $countriesData = [];
            }
            $countries = array_map(
                function ($country) {
                    return [
                        'name' => $country['name'],
                        'callingCode' => str_replace(" ", "", $country['callingCodes'][0]),
                    ];
                },
                $countriesData
            );
            $this->countries = $countries
            ? array_filter(
                $countries,
                function ($country) {
                    return $country['callingCode'] !== "";
                }
            )
            : $this->countries;
        }
        return $this->countries;
    }

    /**
     * Get calling code by country code
     *
     * @param string $countryCode
     * @return string
     */
    public function getCallingCodeByCountryCode($countryCode): string
    {
        try {
            $url = "restcountries.com/v2/alpha/$countryCode?fields=callingCodes";
            $callingCodeJson = $this->driver->fileGetContents($url);
            $callingCodeArray = $this->serialize->unserialize($callingCodeJson);
        } catch (\Exception $exception) {
            $callingCodeArray = "";
        }
        return isset($callingCodeArray['callingCodes']) ? $callingCodeArray['callingCodes'][0] : "";
    }

    /**
     * Get active payment methods
     *
     * @return array
     */
    public function getActivePaymentMethods()
    {
        $payments = $this->_paymentModelConfig->getActiveMethods();
        $methods = [];

        foreach ($payments as $paymentCode => $paymentModel) {
            $paymentTitle = $this->scopeConfig
                ->getValue('payment/' . $paymentCode . '/title');
            $methods[$paymentCode] = [
                'label' => $paymentTitle,
                'value' => $paymentCode,
            ];
        }
        return $methods;
    }

    /**
     * Function to get otp expiry time.
     *
     * @return int
     */
    public function otpExpiry()
    {
        return $this->getConfigValue(
            self::OTP_EXPIRY,
            $this->getStore()->getStoreId()
        );
    }

    /**
     * Get otp expiry time for config data
     *
     * @return int
     */
    public function getOtpExpiryConfig()
    {
        $otpExpiryTime = $this->otpExpiry();
        if ($otpExpiryTime >= 60 && $otpExpiryTime <= 300) {
            $otpExpiryTime = $otpExpiryTime;
        } else {
            $otpExpiryTime = 60;
        }
        return $otpExpiryTime * 1000;
    }

    /**
     * Function to determine guest user
     *
     * @return boolean
     */
    public function isGuestCheckout()
    {
        return !$this->customerSession->create()->isLoggedIn();
    }

    /**
     * Function to get OTP modal configuration
     *
     * @return array
     */
    public function getOtpModalConfig(): array
    {
        $otpAction = $this->urlModel->getUrl('otplogin');
        $otpValidateAction = $this->urlModel->getUrl('otplogin/index/validate');
        $otpTimeToExpireString = $this->getOtpTimeToExpireString();
        return [
            'isModuleEnabled' => $this->isModuleEnable(),
            'resendText' => __("Resend OTP"),
            'validateNumberError' => __("Please enter a valid number."),
            'otpAction' => $otpAction,
            'otpValidateAction' => $otpValidateAction,
            'submitButtonText' => __("Submit"),
            'otpTimeToExpireString' => __($otpTimeToExpireString),
            'isLoggedIn' => (!$this->isGuestCheckout()),
            'isMobileOtpEnabled' => $this->isModuleEnable(),
            'isSendOtpEmailEnabled' => '0',
            'loaderUrl' => $this->assetRepository
            ->createAsset('Coditron_OTPVerification::images/ajax-loader.gif')->getUrl(),
            'customerData' => $this->getCustomerData(),
            'otpTimeToExpireMessage' => __("Your OTP will expire file %1", $otpTimeToExpireString),
            'otpInputPlaceholder' => __('Enter the OTP here'),
            'telephoneInputPlaceholder' => __('Telephone number with country code'),
            'modalTitle' => __('OTP Verification'),
            'validateCustomerCredentialsUrl' => $this->urlModel
            ->getUrl('otplogin/customer/validatecustomercredentials'),
            'validateCustomerOtpUrl' => $this->urlModel->getUrl('otplogin/customer/validatecustomerotp'),
            'sendOtpVia' => $this->sendOtpVia(),
            'forOthersSendOtpVia' => $this->forOthersSendOtpVia(),
            'isEnableAtLogin' => $this->isEnableAtLogin(),
            'isB2BMarketplaceModuleEnable' => $this->isB2BMarketplaceModuleEnable(),
            'optExpireTimeInMilliSec' => $this->getOtpExpiryConfig(),
        ];
    }

    /**
     * Get relative path of checkout configuration route
     *
     * @return string
     */
    public function getCheckoutConfigurationUrl()
    {
        return $this->urlModel->getUrl('otplogin/checkout/configdata');
    }

    /**
     * Returns a formatted string representation of OPT expiry time
     *
     * @return string
     */
    public function getOtpTimeToExpireString(): string
    {
        $timeToExpireInSeconds = $this->otpExpiry();
        $timeToExpireInSeconds = $timeToExpireInSeconds < 60 || $timeToExpireInSeconds > 300
        ? 60 : $timeToExpireInSeconds;
        $timeToExpireMinutes = floor(($timeToExpireInSeconds / 60));
        $timeToExpireSeconds = $timeToExpireInSeconds % 60;
        $timeToExpireMinutesString = $timeToExpireMinutes > 0
        ? "$timeToExpireMinutes minute" . ($timeToExpireMinutes > 1 ? 's' : '')
        : '';
        $timeToExpireSecondsString = $timeToExpireSeconds > 0
        ? "$timeToExpireSeconds second" . ($timeToExpireSeconds > 1 ? 's' : '')
        : '';
        $timeToExpireString = join(
            " and ",
            array_filter(
                [$timeToExpireMinutesString, $timeToExpireSecondsString],
                function ($value) {
                    return !empty($value);
                }
            )
        );

        return $timeToExpireString;
    }

    /**
     * Retrieve customer data
     *
     * @param int $id
     * @return array
     */
    public function getCustomerData($id = null): array
    {
        // @TODO: Move this to Customer helper
        $customerData = [];
        if (empty($id)) {
            $id = $this->customerSession->create()->getCustomerId();
        }
        if (empty($id)) {
            return [];
        }
        /** @var \Magento\Customer\Api\Data\CustomerInterface $customer */
        $customer = $this->customerRepository->getById($id);
        $customerData = $customer->__toArray();
        $customerData['addresses'] = $this->customerAddressData->getAddressDataByCustomer($customer);

        return $customerData;
    }

    /**
     * Send the medium of OTP for create account
     *
     * @return string
     */
    public function sendOtpVia()
    {
        return $this->getConfigValue(self::FOR_CREATE_ACCOUNT_SEND_OTP_VIA, $this->getStore()->getStoreId());
    }

    /**
     * Send the medium of OTP for others
     *
     * @return string
     */
    public function forOthersSendOtpVia()
    {
        return $this->getConfigValue(self::FOR_OTHERS_SEND_OTP_VIA, $this->getStore()->getStoreId());
    }

    /**
     * Get json helper
     *
     * @return \Magento\Framework\Serialize\SerializerInterface
     */
    public function getJsonHelper()
    {
        return $this->serialize;
    }

    /**
     * Get config value for firebase configuration
     *
     * @param  string $field
     * @return string
     */
    public function getFirebaseConfigValue($field)
    {
        $string = 'otp_login/firebasesettings/'.$field;
        return $this->enc->decrypt(
            $this->scopeConfig->getValue(
                $string,
                \Magento\Store\Model\ScopeInterface::SCOPE_STORE
            )
        );
    }

    /**
     * Get admin configurations for firebase Login
     *
     * @return bool
     */
    public function getTestModeStatus()
    {
        $config = $this->scopeConfig->getValue(
            'otp_login/firebasesettings/testing_mode_enable',
            \Magento\Store\Model\ScopeInterface::SCOPE_STORE
        );

        return $config;
    }
}
