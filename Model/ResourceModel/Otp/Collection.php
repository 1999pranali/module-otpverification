<?php
/**
 * Coditron
 *
 * @category  Coditron
 * @package   Coditron_OTPVerification
 * @author    Coditron
 * @copyright Copyright (c) Coditron (https://coditron.com)
 */

namespace Coditron\OTPVerification\Model\ResourceModel\Otp;

use Magento\Framework\Model\ResourceModel\Db\Collection\AbstractCollection;

/**
 * Otp Model ResoucrceModel Collection Class
 */
class Collection extends AbstractCollection
{
    /**
     * Define resource model
     *
     * @return void
     */
    public function _construct()
    {
        $this->_init(
            \Coditron\OTPVerification\Model\Otp::class,
            \Coditron\OTPVerification\Model\ResourceModel\Otp::class
        );
        $this->_map['fields']['entity_id'] = 'main_table.entity_id';
    }
}
