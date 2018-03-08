// pages/other/login.js
var app = getApp();
const config = require("../../config/index")
const utils = require("../../utils/util")
Page({
    data: {
        word: "",
        list: [],
        loading: false,
        loadend: false,
        search: false
    },
    onLoad(options) {
        if (options.word) {
            this.setData({
                word: options.word
            })
        }
    },
    onShareAppMessage() {
        var keyword = this.data.word.trim()
        if (keyword.length) {
            return {
                title: "正在搜索“"+keyword+"” | "+config.name,
                path: '/pages/search/index?word='+keyword
            }
        }
        return {
            title: "搜索 | "+config.name,
            path: '/pages/search/index'
        }
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
    loadData(page = 1) {
        if (this.data.loading) return this
        var keyword = this.data.word.trim()
        if (!keyword.length) return this
        this.setData({
            loading: true,
            loadend: false
        })
        app.libs.api.req('search', {
            keyword,
            page
        }, (err, res) => {
            this.setData({
                search: true,
                loading: false
            })
            if (err) {
                app.model(err.msg)
            } else {
                this.handlerListData(res.list)
                var list = []
                if (page > 1) {
                    list = this.data.list.slice();
                }
                list = list.concat(res.list)
                var info = {
                    list,
                    page: res.page,
                    pages: res.pages,
                    pagenext: res.pagenext,
                    loadend: res.page >= res.pages
                }
                this.setData(info)
            }

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
    },
    /**
     * 接受输入的关键词
     */
    changeword(e) {
        this.setData({
            word: e.detail.value
        })
    },
    /**
     * 提交按钮
     */
    submit() {
        setTimeout(() => {
            var keyword = this.data.word.trim()
            if (!keyword.length) {
                app.msg("请输入关键词")
            }
            this.loadData(1)
        }, 100)
    }
})
