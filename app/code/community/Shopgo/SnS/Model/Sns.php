<?php

class Shopgo_SnS_Model_Sns extends Mage_Core_Model_Abstract
{
    const DE_ADDRESS_REGION_CODE = 'HES';
    const DE_ADDRESS_REGION_NAME = 'Hessen';

    public function isEnabled()
    {
        return Mage::getStoreConfig('shopgo_sns/general/enabled');
    }

    public function getAddresses($params)
    {
        $helper = Mage::helper('sns');
        $result = array(
            'status'  => 0,
            'message' => $helper->__('Could not retrieve SnS addresses'),
            'data'    => ''
        );

        $result = $this->authenticateUser($params);

        if ($result['status']) {
            $result = $this->getAddressList(array(
                'registeration-guid' => $result['data']
            ));
        }

        return $result;
    }

    public function authenticateUser($params)
    {
        $helper = Mage::helper('sns');
        $result = array(
            'status'  => 0,
            'message' => $helper->__('Could not authenticate user'),
            'data'    => ''
        );

        $result['data'] = $helper->restRequest('authenticate_user', $params);

        if (empty($result['data'])) {
            $result['data'] = '';
        } else {
            $xml = new SimpleXMLElement($result['data']);
            if ((string) $xml->Response == 'Failed') {
                $result['data'] = '';
            } else {
                $result['status']  = 1;
                $result['message'] = '';
                $result['data']    = (string) $xml->RegistrationGUID;
            }
        }

        return $result;
    }

    public function getAddressList($params)
    {
        $helper = Mage::helper('sns');
        $result = array(
            'status'  => 0,
            'message' => $helper->__('Could not retrieve addresses list'),
            'data'    => ''
        );

        $result['data'] = $helper->restRequest('get_address_list', $params);

        if (empty($result['data'])) {
            $result['data'] = '';
        } else {
            $xml = new SimpleXMLElement($result['data']);
            if ((string) $xml->ErrorDescription->Error != '') {
                $result['data'] = '';
            } else {
                $result['status']  = 1;
                $result['message'] = '';
                $result['data']    = (array) $xml;
            }
        }

        return $result;
    }
}
