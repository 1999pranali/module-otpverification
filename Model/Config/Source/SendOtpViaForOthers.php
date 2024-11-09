<?php
/**
 * Coditron
 *
 * @category  Coditron
 * @package   Coditron_OTPVerification
 * @author    Coditron
 * @copyright Copyright (c) Coditron (https://coditron.com)
 */

namespace Coditron\OTPVerification\Model\Config\Source;

class SendOtpViaForOthers implements \Magento\Framework\Option\ArrayInterface
{
    /**
     * ToOptionArray()
     *
     * @return array
     */
    public function toOptionArray()
    {
        return [
            ['value' => 'email', 'label' => __('Email')]
        ];
    }
}
