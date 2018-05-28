// pages/article/index.js
const app = getApp();

const config = require('../../config/index');
const utils = require('../../utils/util');

const transform = require('./transform');
const WxParse = require("../../modules/wxParse/wxParse.js")

Page({
    data: {
        info: false,
        images: [],
        art_loading: false,
        commentList: [],
        loading: false,
        loadend: false,
        commentPost: "",
        isLogin: false,
        parse_type: config.parse_type === '1' ? 1 : 2,
    },
    status: {},
    onLoad(options) {
        if (app.globalData.isLogin) {
            this.setData({isLogin: true})
        }
        this.loadArticle(options.id)
        this.setData({id: options.id})
    },
    /**
     * 下拉刷新
     */
    onPullDownRefresh() {
        this.loadArticle(this.data.id, () => {
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
        this.loadComment(this.data.pagenext)
    },
    onShareAppMessage() {
        if (!info) {
            return false
        }
        var title = info.Title
        if (config.share && config.share.article) {
            title = config.share.article
            title = title.replace(/\{%title%\}/g, info.Title)
            title = title.replace(/\{%catename%\}/g, info.Category.Name)
            title = title.replace(/\{%name%\}/g, config.name)
        }
        return {
            title,
            path: '/pages/article/index?id='+info.ID
        }
    },
    /**
     * 加载文章
     */
    loadArticle(id, cb) {
        app.libs.api.req('article', { id },
        (err, res) => {
            if (err) {
                app.model(err.msg)
            } else {
                const article = { ...res };
                this.hanlderInfo(article);
                this.setData({
                    info: article,
                    commentList: []
                });
                setTimeout(() => {
                    this.loadComment(1)
                }, 100);
                wx.setNavigationBarTitle({
                    title: res.Title
                });
            }
            cb && cb();
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
        // 处理正文内容
        const content = info.Content.replace(/&nbsp;/g, '<i class="wxapp-nbsp"></i>').replace(/(\r|\n){1,}/, "<br>");
        if (this.data.parse_type == 2) {
            // 转换富文本信息
            WxParse.wxParse('article', 'html', info.Content, this, 5);
        } else {
            const { nodes, images } = transform(content);
            // 保存图片
            this.setData({
                images,
            });
            info.ContentNodes = nodes;
        }
        delete info.Content;
        delete info.Intro;
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
        item.PostDate = (() => {
            var date = new Date()
            date.setTime(parseInt(item.PostTime)*1000)
            return utils.formatTime(date)
        })()
    },
    // 清楚HtmlTag标签
    clearHTMLTag(str) {
        var reTag = /<(?:.|\s)*?>/g;
        return str.replace(reTag, "");
    },
    // 评论提交
    commentPostSubmit(e) {
        if (this.status.submit) {
            app.msg("请稍后")
            return this
        }
        if (!e.detail.value.content.trim().length) {
            app.msg("留言不能为空")
            return this
        }
        this.status.submit = true
        wx.showLoading()
        app.libs.api.req('postcomment', {
            postid: this.data.info.ID,
            replyid: e.detail.value.replyid || 0,
            content: e.detail.value.content
        }, (err, res) => {
            wx.hideLoading()
            this.status.submit = false
            if (err) {
                app.model(err.msg)
            } else {
                var commentList = this.data.commentList.slice()
                if (this.data.replyIndex > -1) commentList[this.data.replyIndex].isReply = false
                this.hanlderCommentItem(res)
                commentList.unshift(res)
                this.setData({commentList, replyIndex: -1, commentPost: ""})
                if (res.IsLocking) {
                    app.model("留言发布成功，但内容需要审核通过以后，才能正常显示")
                } else {
                    app.msg("评论成功")
                }
            }
        })
    },
    // 内容变更
    commentPostChange(e) {
        this.setData({
            commentPost: e.detail.value
        })
    },
    // 激活回复
    activeReply(e) {
        if (!app.globalData.isLogin) return this
        var id = e.currentTarget.dataset.id
        var commentList = this.data.commentList.slice()
        var replyIndex = -1
        commentList.map((item, index) => {
            if (item.ID == id) {
                item.isReply = true
                replyIndex = index
            } else {
                item.isReply = false
            }
        })
        this.setData({commentList, replyIndex})
    },
    // 取消回复
    cancelReply(e) {
        if (!app.globalData.isLogin) return this
        var id = e.currentTarget.dataset.id
        var commentList = this.data.commentList.slice()
        for (let i = 0, n = commentList.length; i < n; i++) {
            if (commentList[i].ID == id) {
                commentList[i].isReply = false
                break
            }
        }
        this.setData({commentList})
    },
    // 激活登录
    activeLogin() {
        let routes = getCurrentPages()
        let nowRoute = routes[routes.length - 1]
        app.globalData.login_cb = function() {
            let param = []
            for (let i in nowRoute.options) {
                param.push(i+'='+nowRoute.options[i])
            }
            wx.redirectTo({
                url: '/'+nowRoute.route + param.length?('?'+param.join('&')):''
            })
        }
        wx.redirectTo({
            url: '/pages/user/login'
        })
    },
    // 刷新评论列表
    refreshCommentList() {
        this.loadComment(1);
    },
    articleLongTap() {
        console.log('aaa')
        if (this.data.images.length) {
            wx.previewImage({
                urls: [...this.data.images]
            })
        }
    },
    // 复制链接地址
    copyArticleUrl() {
        if (this.data.info.Url) {
            wx.setClipboardData({
                data: this.data.info.Url,
                success: (res) => {
                    app.msg('文章链接已复制');
                }
            });
        }
    },
});
