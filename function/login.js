// npm下载的库
const Promise = require('../modules/es6-promise'); // promise
const regeneratorRuntime = require('../modules/regenerator-runtime'); // co

/**
 * 登录相关的API接口
 */
const api = require('./api')

/**
 * 登录流程类
 */
class Login {
    constructor() {
        this.data = {}
        this.status = {}
        this.data.task = []
    }

    /**
     * 初始化
     *
     * @param {type} options 其它备用参数
     */
    init(options) {
        this.options = options
        return this
    }

    /**
     * 调用登录流程
     * @param {function} cb 回调函数
     */
    login(cb) {
        ;(async () => {
            let userinfo = await this.getWXUserInfo()
            if (!userinfo) {
                cb({code: 200000, msg: "未能正常获取用户的微信资料"})
                return
            }

            let wxLogin = await this.wxLogin()
            if (!wxLogin) {
                cb({code: 200001, msg: "微信登录失败"})
                return
            }

            let serverLogin = await this.serverLogin()
            if (!serverLogin) {
                cb({code: 200100, msg: "服务器登录失败"})
                return
            }

            this.save().task()
            cb(null)
        })()

        return this
    }

    /**
     * 用户的登录状态验证
     * @param {function} cb 回调函数
     */
    check(cb) {

        if (!this.data.thirdsession || !this.data.thirdsession.length) {
            cb({msg: 'thirdsession不存在'})
            return this
        }

        ;(async () => {
            let wxCheckSession = this.wxCheckSession()
            if (!wxCheckSession) {
                cb({msg: '微信验证登录失效'})
                return
            }

            let serverCheckSession = this.serverCheckSession()
            if (!wxCheckSession) {
                cb({msg: '服务器验证登录失效'})
                return
            }

            cb(null)
        })()

        return this
    }

    /**
     * 获取用户的微信个人信息
     */
    getWXUserInfo() {
        return new Promise((resolve, reject) => {
            wx.getUserInfo({
                success: res => {
                    this.data.userinfo = res.userInfo
                    resolve(true)
                },
                fail: err => {
                    console.log('wx.getUserInfo', err)
                    resolve(false)
                }
            })
        })
    }

    /**
     * 调用微信的登录
     */
    wxLogin() {
        return new Promise((resolve, reject) => {
            wx.login({
                success: res => {
                    this.data.code = res.code
                    resolve(true)
                },
                fail: err => {
                    console.log('wx.login', err)
                    resolve(false)
                }
            })
        })
    }

    /**
     * 验证微信的登录是否还有效
     */
    wxCheckSession() {
        let _this = this
        return new Promise((resolve, reject) =>  {
            wx.checkSession({
                success: () => {
                    resolve(true)
                },
                fail: err => {
                    console.log('wx.checkSession', err)
                    resolve(false)
                }
            })
        })
    }

    /**
     * 远程服务器登录
     */
    serverLogin() {
        return new Promise((resolve, reject) => {
            api.req('login', {
                code: this.data.code
            }, (err, res) => {
                if (err) {
                    console.log('api.req.login', err)
                    resolve(false)
                } else {
                    this.data.sessionid  = res.sessionid
                    resolve(true)
                }
            })
        })
    }

    /**
     * 远程服务器验证session是否有效
     */
    serverCheckSession() {
        return new Promise((resolve, reject) => {
            api.req('check_session', {}, (err, res) => {
                if (err) {
                    console.log('api.req.checkSession', err)
                    resolve(false)
                } else {
                    resolve(true)
                    if (res.data.status == '200') {
                    } else {
                        resolve(false)
                    }
                }
            })
        })
    }


    /**
     * 保存用户信息
     */
    save() {
        wx.setStorage({
            key: 'userinfo',
            data: this.data.userinfo
        })
        wx.setStorage({
            key: 'sessionid',
            data: this.data.sessionid.replace(/\n|\r|\s/g, '')
        })
        return this
    }

    /**
     * 执行排队任务
     */
    task() {
        /**
         * task只能执行一次，所以此处采用pop
         */
        function task_check() {
            if (!this.data.task.length) return this
            let item = this.data.task.pop()
            typeof item === 'function' && item.call(this, this.data.userinfo)
            task_check.call(this)
        }
        task_check.call(this)
        return this
    }
}

module.exports = new Login()
