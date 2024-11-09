<?php
/**
 * Coditron
 *
 * @category  Coditron
 * @package   Coditron_OTPVerification
 * @author    Coditron
 * @copyright Copyright (c) Coditron (https://coditron.com)
 */

namespace Coditron\OTPVerification\ViewModel;

class HelperViewModel implements \Magento\Framework\View\Element\Block\ArgumentInterface
{
    /**
     * @var \Magneto\Checkout\Model\CompositeConfigProvider
     */
    private $configProvider;

    /**
     * @var \Magento\Framework\Serialize\SerializerInterface
     */
    private $serialize;

    /**
     * Construct
     *
     * @param \Magento\Checkout\Model\CompositeConfigProvider $configProvider
     * @param \Magento\Framework\Serialize\SerializerInterface $serialize
     */
    public function __construct(
        \Magento\Checkout\Model\CompositeConfigProvider $configProvider,
        \Magento\Framework\Serialize\SerializerInterface $serialize
    ) {
        $this->serialize = $serialize;
        $this->configProvider = $configProvider;
    }

    /**
     * Get Checkout configuration
     *
     * @return array
     */
    public function getConfig()
    {
        return $this->configProvider->getConfig();
    }

    /**
     * Get helper singleton
     *
     * @param string $className
     * @return \Magento\Framework\App\Helper\AbstractHelper
     * @throws \LogicException
     */
    public function helper($className)
    {
        $helper = \Magento\Framework\App\ObjectManager::getInstance()->get($className);
        if (false === $helper instanceof \Magento\Framework\App\Helper\AbstractHelper) {
            throw new \LogicException($className . ' doesn\'t extends Magento\Framework\App\Helper\AbstractHelper');
        }
        return $helper;
    }

    /**
     * Get serializer
     *
     * @return \Magento\Framework\Serialize\SerializerInterface
     */
    public function getSerializer()
    {
        return $this->serialize;
    }
}
