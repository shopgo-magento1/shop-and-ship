<?php

class Shopgo_SnS_Block_Customer_Address extends Mage_Core_Block_Template
{
    public function isEnabled()
    {
        return Mage::getModel('sns/sns')->isEnabled();
    }

    public function getAddressUrl()
    {
        return Mage::getUrl('sns/address/getlist');
    }

    public function getAddressesRegions()
    {
        return Mage::helper('sns')->getAddressesRegions(true);
    }

    public function getMissingAddressRegions()
    {
        return json_encode(Mage::helper('sns')->getMissingRegions());
    }
}
