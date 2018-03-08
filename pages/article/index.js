// pages/article/index.js
const app = getApp()

const WxParse = require("../../modules/wxParse/wxParse.js")
const config = require("../../config/index")
const utils = require("../../utils/util")

Page({
    data: {
        info: false,
        fail: false,
        art_loading: false,
        commentList: [],
        loading: false,
        loadend: false,
    },
    onLoad(options) {
        this.loadArticle(options.id)
    },
    /**
     * 上拉加载
     */
    onReachBottom() {
        if (!this.data.pagenext) return this
        if (this.data.page == this.data.pages) return this
        this.loadComment(this.data.pagenext)
    },
    /**
     * 加载文章
     */
    loadArticle(id) {
        app.libs.api.req('article', { id },
        (err, res) => {
            if (err) {
                app.model(err.msg)
                this.setData({
                    fail: true
                })
            } else {
                this.hanlderInfo(res)
                this.setData({
                    info: res,
                    commentList: []
                })
                setTimeout(() => {
                    this.loadComment(1)
                }, 100)
                wx.setNavigationBarTitle({
                    title: res.Title
                })
            }
        })
        return this
    },
    /**
     * 加载留言评论
     */
    loadComment(page = 1, cb) {
        if (!this.data.info) return this
        if (this.data.loading) return this
        this.setData({
            loading: true,
            loadend: false
        })
        app.libs.api.req('comment', { id: this.data.info.ID, page },
        (err, res) => {
            this.setData({
                loading: false
            })
            if (err) {
                app.model(err.msg)
            } else {
                this.hanlderComment(res.list)
                var commentList = []
                if (page > 1) {
                    commentList = this.data.commentList.slice()
                }
                commentList = commentList.concat(res.list)
                this.setData({
                    commentList,
                    page: res.page,
                    pages: res.pages,
                    pagenext: res.pagenext,
                    loadend: res.page >= res.pages
                })
            }
            cb && cb()
        })
        return this
    },
    /**
     * 转换数据
     */
    hanlderInfo(info) {
        info.PostDate = (function() {
            var date = new Date()
            date.setTime(parseInt(info.PostTime)*1000)
            return utils.formatDate(date)
        })()
        info.RelatedList.map(item => {
            item.OpenType = "redirect"
        })
        // 转换富文本信息
        WxParse.wxParse('article', 'html', info.Content, this, 5)
        delete info.Content
        delete info.Intro
    },
    /**
     * 处理评论内容
     */
    hanlderComment(list) {
        list.map(item => {
            this.hanlderCommentItem(item)
            if (item.ParentID > 0) this.hanlderCommentItem(item.Parents)
        })
    },
    hanlderCommentItem(item) {
        item.Content = this.clearHTMLTag(item.Content)
        item.PostDate = (function() {
            var date = new Date()
            date.setTime(parseInt(item.PostTime)*1000)
            return utils.formatTime(date)
        })()
    },
    clearHTMLTag(str) {
        var reTag = /<(?:.|\s)*?>/g;
        return str.replace(reTag, "");
    }
})
