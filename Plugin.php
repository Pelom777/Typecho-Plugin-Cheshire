<?php
/**
 * Cheshire
 * 
 * @package Cheshire
 * @author Pelom
 * @version 1.0.0
 * @link http://pelom.cn/
 */
class Cheshire_Plugin implements Typecho_Plugin_Interface
{
    /**
     * 激活插件方法,如果激活失败,直接抛出异常
     * 
     * @access public
     * @return void
     * @throws Typecho_Plugin_Exception
     */
    public static function activate(){
        Typecho_Plugin::factory('Widget_Archive')->header = array('Cheshire_Plugin', 'header');
        Typecho_Plugin::factory('Widget_Archive')->footer = array('Cheshire_Plugin', 'footer');
    }

    /**
     * 禁用插件方法,如果禁用失败,直接抛出异常
     * 
     * @static
     * @access public
     * @return void
     * @throws Typecho_Plugin_Exception
     */
    public static function deactivate(){}

    /**
     * 获取插件配置面板
     * 
     * @access public
     * @param Typecho_Widget_Helper_Form $form 配置面板
     * @return void
     */
    public static function config(Typecho_Widget_Helper_Form $form){}
    
    /**
     * 个人用户的配置面板
     * 
     * @access public
     * @param Typecho_Widget_Helper_Form $form
     * @return void
     */
    public static function personalConfig(Typecho_Widget_Helper_Form $form){}

    /**
     * 插件实现方法
     * 
     * @access public
     * @return void
     */
    public static function render(){}

    public static function header(){
        echo '<script src="' . Helper::options()->pluginUrl . '/Cheshire/src/build/spine-webgl.js"></script>';
        echo '<script src="' . Helper::options()->pluginUrl . '/Cheshire/src/main.js"></script>';
    }

    public static function footer(){
        echo '<canvas id="canvas"></canvas>';
        echo '<script>main("' . Helper::options()->pluginUrl . '/Cheshire/assets/chaijun/chaijun.skel");</script>';
    }
}
?>