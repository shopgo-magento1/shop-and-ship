<?php

class Shopgo_SnS_AddressController extends Mage_Core_Controller_Front_Action
{
    public function getListAction()
    {
        $result = array(
            'status'  => 0,
            'message' => $this->__('Shop and Ship feature is not enabled'),
            'data'    => array()
        );

        $sns = Mage::getModel('sns/sns');

        if (!$sns->isEnabled()) {
            Mage::app()->getResponse()
                ->setHeader('content-type', 'application/json; charset=utf-8')
                ->setBody(json_encode($result));

            return false;
        }

        $params = $this->getRequest()->getPost();

        if (empty($params['sns-email'])
            || empty($params['sns-password'])) {
            $result['message'] = $this->__('Shop and Ship email and password are required');
        } else {
            $result = $sns->getAddresses($params);
        }

        Mage::app()->getResponse()
            ->setHeader('content-type', 'application/json; charset=utf-8')
            ->setBody(json_encode($result));
    }
}
