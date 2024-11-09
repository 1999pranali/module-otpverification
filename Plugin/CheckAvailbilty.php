<?php
/**
 * Coditron
 *
 * @category  Coditron
 * @package   Coditron_OTPVerification
 * @author    Coditron
 * @copyright Copyright (c) Coditron (https://coditron.com)
 */

namespace Coditron\OTPVerification\Plugin;

use Magento\Customer\Api\CustomerRepositoryInterface;
use Magento\Store\Model\StoreManagerInterface;
use Magento\Customer\Model\AccountManagement;

class CheckAvailbilty
{
    /**
     * @var \Magento\Store\Model\StoreManagerInterface
     */
    private $storeManager;

    /**
     * @var \Magento\Customer\Api\CustomerRepositoryInterface
     */
    private $customerRepository;

    /**
     * Construct
     *
     * @param CustomerRepositoryInterface $customerRepository
     * @param StoreManagerInterface $storeManager
     */
    public function __construct(
        CustomerRepositoryInterface $customerRepository,
        StoreManagerInterface $storeManager
    ) {
        $this->customerRepository = $customerRepository;
        $this->storeManager = $storeManager;
    }
     
    /**
     * Email Available
     *
     * @param AccountManagement $subject
     * @param string $result
     * @param string $customerEmail
     * @param int $websiteId
     * @return bool
     */
    public function afterIsEmailAvailable(AccountManagement $subject, $result, $customerEmail, $websiteId = null)
    {
        if ($websiteId === null) {
            $websiteId = $this->storeManager->getStore()->getWebsiteId();
        }
        if (filter_var($customerEmail, FILTER_VALIDATE_EMAIL)) {
            return false;
        } 
        // else {
        //     $objectManager = \Magento\Framework\App\ObjectManager::getInstance();
        //     $customerFactory = $objectManager->get(Magento\Customer\Model\ResourceModel\Customer\Collection::class);
        //     $customerFactory->addAttributeToSelect('*')
        //     ->addAttributeToFilter('default_phone_number', $customerEmail)
        //     ->load();
        //     if (!empty($customerFactory->getData())) {
        //         $this->customerRepository->get($customerFactory->getData()[0]['email'], $websiteId);
        //         return false;
        //     } else {
        //         return true;
        //     }
        // }
    }
}
