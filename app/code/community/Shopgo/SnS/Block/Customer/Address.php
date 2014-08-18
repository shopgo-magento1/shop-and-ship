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

    public function getDeAddressRegion()
    {
        return json_encode(array(
            'code' => Shopgo_SnS_Model_Sns::DE_ADDRESS_REGION_CODE,
            'name' => Shopgo_SnS_Model_Sns::DE_ADDRESS_REGION_NAME
        ));
    }
}
