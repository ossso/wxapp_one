//index.js
//获取应用实例
const app = getApp()

const config = require("../../config/index")
const utils = require("../../utils/util")

Page({
    data: {
        swiper: [
            {
                "route": null,
                "img": "../../images/home/swiper.demo.jpg"
            }
        ],
        loading: false,
        loadend: false,
        list: [],
        medias: [],
    },
    onLoad() {
        wx.setNavigationBarTitle({
            title: config.name
        })
    },
    onShareAppMessage() {
        var title = "欢迎使用"+config.name+"的小程序"
        if (config.share && config.share.home) {
            title = config.share.home
        }
        return {
            title,
            path: '/pages/home/index'
        }
    },
    onReady() {
        // 读取缓存，执行2小时缓存效果方案
        var home_cache = wx.getStorageSync('home_cache')
        var home_cache_times = wx.getStorageSync('home_cache_times')
        if (home_cache && home_cache_times && (new Date).getTime() - home_cache_times < 2 * 60 * 60 * 1000) {
            this.setData(home_cache)
        } else {
            this.loadData()
        }
    },
    /**
     * 下拉刷新
     */
    onPullDownRefresh() {
        this.loadData(1, () => {
            app.msg("刷新成功")
            wx.stopPullDownRefresh()
        })
    },
    /**
     * 上拉加载
     */
    onReachBottom() {
        if (!this.data.pagenext) return this
        if (this.data.page == this.data.pages) return this
        this.loadData(this.data.pagenext)
    },
    /**
     * 加载数据
     */
    loadData(page = 1, cb) {
        if (this.data.loading) return this
        this.setData({
            loading: true,
            loadend: false
        })
        app.libs.api.req("home", {page}, (err, res) => {
            this.setData({
                loading: false
            })
            if (err) {
                app.msg(err.msg)
            } else {
                this.handlerListData(res.list)
                var list = []
                if (page > 1) {
                    list = this.data.list.slice();
                }
                list = list.concat(res.list)
                this.setData({
                    list,
                    page: res.page,
                    pages: res.pages,
                    pagenext: res.pagenext,
                    loadend: res.page >= res.pages
                })

                if (page == 1) {
                    this.setData({
                        medias: (() => {
                            var len = res.medias.length
                            if (len%2 == 1) len = len - 1
                            return res.medias.slice(0, len)
                        })()
                    })
                    // 首页缓存
                    var info = {
                        list: this.data.list,
                        medias: this.data.medias,
                        page: this.data.page,
                        pages: this.data.pages,
                        pagenext: this.data.pagenext,
                        loadend: this.data.loadend
                    }
                    // 判断是否有swiper
                    if (res.swiper) {
                        this.setData({
                            swiper: res.swiper
                        })
                        info.swiper = res.swiper
                    }
                    wx.setStorage({
                        key: "home_cache",
                        data: info
                    })
                    wx.setStorage({
                        key: "home_cache_times",
                        data: (new Date).getTime()
                    })
                }
            }
            cb && cb()
        })
    },
    /**
     * 处理list的数据
     */
    handlerListData(list) {
        list.map(item => {
            item.PostDate = (function() {
                var date = new Date()
                date.setTime(parseInt(item.PostTime)*1000)
                return utils.formatDate(date)
            })()
        })
    }
})
