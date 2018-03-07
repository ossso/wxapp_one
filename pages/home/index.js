//index.js
//获取应用实例
const app = getApp()

const config = require("../../config/index")

Page({
    data: {
        swiper: [
            {
                "route": null,
                "img": "../../images/home/swiper.demo.jpg"
            }
        ],
    },
    onLoad: function() {
        wx.setNavigationBarTitle({
            title: config.name
        })
    }
})
