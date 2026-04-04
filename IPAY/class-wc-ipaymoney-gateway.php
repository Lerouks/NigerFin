<?php
// Exit if accessed directly.
if (!defined('ABSPATH')) {
    exit;
}

require_once(ABSPATH . 'wp-admin/includes/plugin.php');

class WC_Ipaymoney_Gateway extends WC_Payment_Gateway
{
    /**
     * Protected constructor to prevent creating a new instance of the
     * *Singleton* via the `new` operator from outside of this class.
     */
    public function __construct()
    {

        $this->id = 'ipaymoney_woocommerce_plugin';
        $this->icon = plugins_url('../assets/img/logo.png', __FILE__);
        $this->has_fields = false;
        $this->title = array_key_exists('title', $this->settings) ? $this->settings['title']: '';
        $this->method_title = 'iPaymoney';
        $this->method_description = array_key_exists('description', $this->settings) ? $this->settings['description']: '';

        $this->init_form_fields();

        $this->init_settings();

        $this->ipaymoney_config = array();


        foreach ($this->settings as $setting_key => $value) {
            $this->$setting_key = $value;
            $this->ipaymoney_config[$setting_key] = $value;
        }

        $this->testmode = 'yes' === $this->testmode;
        $this->ipaymoney_config['key'] = $this->public_key;


        if ($this->description === "") {
            $this->description = "<div>
            <div class='ipaymoney-payment-method'>
              Moov Benin, Mtn Benin, Airtel Niger, Moov Niger, Visa, Mastercard, American Express
            </div>
        </div>";
        }

        $this->import_ipaymoney();
        add_action('admin_notices', array($this, 'do_ssl_check'));
        add_action('woocommerce_receipt_' . $this->id, array($this, 'receipt_page'));
        add_action('woocommerce_api_' . strtolower(get_class($this)), array($this, 'webhook'));

        if (is_admin()) {
            add_action('woocommerce_update_options_payment_gateways_' . $this->id, array($this, 'process_admin_options'));
            $this->import_admin_scripts();
        }

        if (!$this->is_valid_for_use()) {
            $this->enabled = false;
        }
    }

    /**
     * Initialise Gateway Settings Form Fields.
     */
    public function init_form_fields()
    {
        $this->form_fields = include plugin_dir_path(__DIR__) . '/admin/ipaymoney-settings.php';
    }
    
    public function import_ipaymoney()
    {
        $filename = 'ipaymoney-woocommerce-plugin.php';
        $path = plugin_dir_path(__DIR__) . $filename;
        $plugin_information = get_plugin_data($path);

        wp_register_style('custom-ipaymoney-style', plugins_url('../assets/css/style.css', __FILE__));
        wp_enqueue_style('custom-ipaymoney-style');

        // wp_enqueue_script('setup-ipaymoney-script', "https://cdn.i-pay.money/k.js", [], $plugin_information['Version'], true);
        wp_enqueue_script('setup-ipaymoney-script', plugins_url( '../assets/js/checkout.js', __FILE__ ), [], $plugin_information['Version'], true);        

        if ($this->testmode == 'yes') {
            $sandbox = true;
        } else {
            $sandbox = false;
        }
    }

    public function import_admin_scripts()
    {
        wp_enqueue_script('jscolor', plugins_url('../assets/js/jscolor.js', __FILE__), [], 'v1', true);
        wp_enqueue_script('setup-admin-script', plugins_url('../assets/js/admin.js', __FILE__), [], 'v1', true);
    }

    /**
     * Check if this gateway is enabled and can work with user currency.
     */
    public function is_valid_for_use()
    {
        //verify currency
        $currency = get_woocommerce_currency();

        $allowed_currency = array('XOF');

        if (!in_array($currency, $allowed_currency)) {
            $this->msg = __('iPaymoney does not support your store currency. Kindly set it to XOF (FCFA)', 'ipaymoney-woocommerce') . '<a href="' . admin_url('admin.php?page=wc-settings&tab=general') . '">here</a>';

            return false;
        }
        return true;
    }


    public function admin_options()
    {
        if (!$this->is_valid_for_use()) {
            echo '<div class="inline error"><p><strong>' . __('iPaymoney Payment Gateway Disabled', 'ipaymoney-woocommerce') . '</strong>: ' . $this->msg . '</p></div>';
        } else {
            echo '<table class="form-table">';
            $this->generate_settings_html();
            echo '</table>';
        }
    }

    public function process_payment($order_id)
    {
        $order = new WC_Order($order_id);

        $this->order_id = $order_id;

        $order->reduce_order_stock();
        return array(
            'result' => 'success',
            'redirect' => $order->get_checkout_payment_url(true)
        );
    }

    /**
     * Checkout receipt page
     *
     * @return void
     */
    public function receipt_page($order)
    {
        $this->ipaymoney_config['callback'] = $this->get_callback_url($order);

        //TODO: add transaction reason

        $order = wc_get_order($order);
        $date = new DateTime();

        if ($this->testmode == 'yes') {
            $environement = 'sandbox';
        } else {
            $environement = 'live';
        }
        
        $this->ipaymoney_config['environement'] = $environement;
        
        if (version_compare(WOOCOMMERCE_VERSION, '2.7.0', '>=')) {
            $this->ipaymoney_config['amount'] = $order->get_total();
            $this->ipaymoney_config['phone'] = $order->get_billing_phone();
            $this->ipaymoney_config['email'] = $order->get_billing_email();
            $this->ipaymoney_config['full_name'] = $order->get_formatted_billing_full_name();
            $this->ipaymoney_config['transaction_id'] = 'ipaymoney_wooc-'.trim(str_replace('#', '', $order->get_order_number())).'-'.$date->getTimestamp();
        } else {
            $this->ipaymoney_config['amount'] = $order->order_total;
            $this->ipaymoney_config['phone'] = $order->billing_phone;
            $this->ipaymoney_config['email'] = $order->billing_email;
            $this->ipaymoney_config['full_name'] = $order->billing_first_name . ' ' . $order->billing_last_name;
            $this->ipaymoney_config['transaction_id'] = 'ipaymoney_wooc-'.trim(str_replace('#', '', $order->order_number)).'-'.$date->getTimestamp();
        }

        echo '<p>' . __('Thank you for your order, please click the <b>Proceed to payment</b> button below to make payment.', 'ipaymoney-woocommerce') . '</p>';
        echo '<a class="button cancel" href="' . esc_url($order->get_cancel_order_url()) . '">';
        echo __('Cancel order', 'ipaymoney-woocommerce') . '</a> ';
        echo '<button class="button alt wc-forward ipaymoney-button"
            data-amount="'.$this->ipaymoney_config['amount'].'"
            data-environement="'.$this->ipaymoney_config['environement'].'"
            data-key="'.$this->ipaymoney_config['key'].'"
            data-transaction-id="'.$this->ipaymoney_config['transaction_id'].'"
            data-sdk="woocommerce"
            data-callback-url="'.$this->ipaymoney_config['callback'].'">' . __('Proceed to payment', 'ipaymoney-woocommerce') . '</button> ';

    }

    public function get_callback_url($order_id)
    {
        return home_url('/') . '?wc-api=' . get_class($this) . '&state=' . $order_id;
    }

    public function webhook()
    {
        global $woocommerce;
        $order_id = $_GET["state"];
        $order = wc_get_order($order_id);
        
        if (isset($_GET['external_reference']) && isset($_GET['state']) && isset($_GET["status"]) && isset($_GET["amount"])) {
            $status = $_GET["status"];
            $amount = $_GET["amount"];
            $external_reference = $_GET["external_reference"];

            if ($status == 'succeeded') {
                $order->update_status('completed');
                $order->add_order_note(__('Payment was successful on iPaymoney', 'ipaymoney-woocommerce'));
                $order->add_order_note('iPaymoney transaction Id: ' . $external_reference);
                $customer_note = __('Thank you for your order.<br>', 'ipaymoney-woocommerce');
                $customer_note .= __('Your payment was successful, we are now <strong>processing</strong> your order.', 'ipaymoney-woocommerce');
                $order->add_order_note($customer_note, 1);
                wc_add_notice($customer_note, 'notice');
                $woocommerce->cart->empty_cart();
                wp_redirect($this->get_return_url($order));
            } elseif ($status == 'failed') {
                $this->handlePaymentFailed($order);
            } else {
                $this->handlePaymentFailed($order);
            }
        } else {
            $this->handlePaymentFailed($order);
        }
    }

    public function handlePaymentFailed($order)
    {
        $order->add_order_note(__('The order payment failed on iPaymoney', 'ipaymoney-woocommerce'));
        $customer_note = __('Your payment <strong>failed</strong>. ', 'ipaymoney-woocommerce');
        $customer_note .= __('Please, try funding your account.', 'ipaymoney-woocommerce');
        $order->add_order_note($customer_note, 1);
        wc_add_notice($customer_note, 'notice');

        $url = wc_get_checkout_url();
        wp_redirect($url);
    }


    // Check if we are forcing SSL on checkout pages
    public function do_ssl_check()
    {
        if ($this->enabled == "yes") {
            if (get_option('woocommerce_force_ssl_checkout') == "no") {
                echo "<div class=\"error\"><p>" . sprintf(__("<strong>%s</strong> is enabled and WooCommerce is not forcing the SSL certificate on your checkout page. Please ensure that you have a valid SSL certificate and that you are <a href=\"%s\">forcing the checkout pages to be secured.</a>", 'ipaymoney-woocommerce'), $this->method_title, admin_url('admin.php?page=wc-settings&tab=checkout')) . "</p></div>";
            }
        }
    }
}
