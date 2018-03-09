//index.js
//获取应用实例
const app = getApp()

const utils = require("../../utils/util")

var system = wx.getSystemInfoSync()

Page({
    data: {
        winHeight: system.windowHeight - 40,
        titleWidth: 0,
        swiperIndex: 0,
        cates: [],
        swipers: [],
    },
    onLoad() {
        var cates = wx.getStorageSync("cates")
        var cates_times = wx.getStorageSync("cates_times")
        if (cates && cates_times && (new Date).getTime() - cates_times < 2 * 60 * 60 * 1000) {
            var titleWidth = 0
            cates.map(item => {
                item.info = this.getCateInfo(null, item.ID)
                titleWidth += item.Name.length * 15 + 5 + 10
            })
            if (cates.length) titleWidth -= 10
            this.setData({cates, titleWidth})
            this.getNowCateInfo(true)
        } else {
            this.loadCate()
        }
    },
    /**
     * 激活刷新
     */
    activeRefresh() {
        wx.startPullDownRefresh()
        this.loadCate(() => {
            app.msg("刷新成功")
            wx.stopPullDownRefresh()
        })
    },
    /**
     * 上拉加载
     */
    loadPullData() {
        var info = this.getCateInfo(this.data.swiperIndex)
        if (!info.pagenext) return this
        if (info.page == info.pages) return this
        this.loadList(info.pagenext, info.cateid)
        return this
    },
    onShareAppMessage() {
        if (!info) {
            return false
        }
        var title = "分类阅读中心 - " + config.name
        if (config.share && config.share.cates) {
            title = config.share.cates
            title = title.replace(/\{%title%\}/g, "分类阅读")
            title = title.replace(/\{%name%\}/g, config.name)
        }
        return {
            title,
            path: '/pages/list/index'
        }
    },
    /**
     * swiper切换反馈
     */
    swiperChange(e) {
        if (e.detail.current != this.data.swiperIndex) {
            this.setData({
                swiperIndex: e.detail.current
            })
        }
        this.getNowCateInfo()
    },
    /**
     * swiper切换执行
     */
    swiperSwitch(e) {
        this.setData({
            swiperIndex: e.currentTarget.dataset.current
        })

        this.getNowCateInfo()
    },
    /**
     * 获取当前分类信息
     */
    getNowCateInfo(status) {
        var info = this.getCateInfo(this.data.swiperIndex)
        if (status) {
            this.loadList(1, info.cateid)
        } else if (!info.page) {
            this.loadList(1, info.cateid)
        }
    },
    /**
     * 获取对应分类的信息
     */
    getCateInfo(index, cateid = false) {
        var info = {
            page: null,
            pages: null,
            pagenext: null,
            loading: true,
            loadend: false,
        }
        if (index || index === 0) {
            var cate = this.data.cates[index]
            cateid = cate.ID
            info = Object.assign({}, info, cate.info)
        }
        info['cateid'] = cateid
        return info
    },
    /**
     * 获取分类
     */
    loadCate(cb) {
        app.libs.api.req("catelist", {}, (err, res) => {
            if (err) {
                app.msg(err.msg)
            } else {
                var cates = res
                wx.setStorage({
                    key: "cates",
                    data: cates
                })
                wx.setStorage({
                    key: "cates_times",
                    data: (new Date()).getTime()
                })
                // 准备数据渲染
                var titleWidth = 0
                cates.map(item => {
                    titleWidth += item.Name.length * 15 + 5 + 10
                    item.info = this.getCateInfo(null, item.ID)
                })
                if (cates.length) titleWidth -= 10
                this.setData({
                    cates,
                    titleWidth
                })
                this.getNowCateInfo(true)
            }
            cb && cb()
        })
        return this
    },
    /**
     * 加载数据
     */
    loadList(page = 1, cateid, cb) {
        var info = this.getCateInfo(this.data.swiperIndex)
        if (page > 1 && info.loading) return this
        var cates = this.data.cates
        cates.map(item => {
            if (item.ID == info.cateid) {
                item.info.loading = true
            }
        })
        this.setData({cates})
        app.libs.api.req("list", {page, cateid}, (err, res) => {
            var data = {}
            if (err) {
                app.model(err.msg)
            } else {
                this.handlerListData(res.list)
                var list = []
                if (page > 1) {
                    list = info.list.slice();
                }
                list = list.concat(res.list)
                data.list = list
                data.page = res.page
                data.pages = res.pages
                data.pagenext = res.pagenext
                data.loadend = res.page >= res.pages
            }
            data.loading = false
            cates.map(item => {
                if (item.ID == info.cateid) {
                    item.info = data
                }
            })
            this.setData({cates})
            cb && cb()
        })
        return this
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
        return this
    },
})
