/**
 * API处理工具
 */

const config = require('../config')
const apilist = require('../config/apilist')

class API {
    constructor() {
        this.data = {}
        this.status = {}
        this.system = ["zbp"]
        this.sessionid = wx.getStorageSync('sessionid')
    }

    geturl(type) {
        if (this.system.indexOf(config.system) == -1) {
            console.error("选配的系统不正确")
            return null
        }
        return this[config.system](type)
    }

    zbp(type) {
        var url = config.host
        urlrule = config.urlrule
        if (typeof urlrule !== 'string') urlrule = urlrule.toString()
        switch (urlrule) {
            // 伪静态模式
            case "0":
                url += "os_wxapi/v1/" + type.toLowercase()
            break
            // 动态模式
            case "1":
                url += "zb_system/cmd.php?cmd=os_wxapi&v=v1&mode=" + type.toLowercase()
            break
            // index.php伪静态模式
            case "2":
                url += "index.php/os_wxapi/v1/" + type.toLowercase()
            break
        }
        return url
    }

    req(type, sendData, cb) {
        var url = this.geturl(type)
        if (!url) {
            cb && cb({
                code: -1,
                msg: "小程序系统异常"
            })
            return this
        }

        let data = {
            "sessionid": this.sessionid
        }
        let params = apilist[type].params
        params.forEach(item => {
            if (!sendData[item]) {
                console.log("api - req", type)
                console.log("必要参数["+item+"]不存在", sendData, sendData[item])
                return false
            }
        })
        data = Object.assign({}, data, sendData)

        let header = {}
        if (apilist[type].type == "post") {
            header['content-type'] = "application/x-www-form-urlencoded"
        }

        let method = apilist[type].type?apilist[type].type.toUpperCase():"GET"

        let options = {
            url: url,
            data,
            header,
            method,
            dataType: 'json',
            success: res => {
                console.log(url, res)
                if (res.statusCode == 200 && (!res.data.status || res.data.status == 100000)) {
                    cb && cb(null, res.data.result)
                } else
                /**
                 * 登录超时处理
                 * 自动跳转至登录页面
                 */
                if (res.data.status == 200000 && this.appGlobalData) {
                    let routes = getCurrentPages()
                    let nowRoute = routes[routes.length - 1]
                    this.appGlobalData.login_cb = function() {
                        // 判断返回的路由路径
                        if (nowRoute.route == 'pages/user/index' || nowRoute.route == 'pages/home/index') {
                            wx.switchTab({
                                url: '/'+nowRoute.route
                            })
                        } else {
                            let param = []
                            for (let i in nowRoute.options) {
                                param.push(i+'='+nowRoute.options[i])
                            }
                            wx.redirectTo({
                                url: '/'+nowRoute.route + param.length?('?'+param.join('&')):''
                            })
                        }
                    }
                    wx.redirectTo({
                        url: '/pages/user/login'
                    })
                } else {
                    cb && cb({
                        code: res.data.status,
                        msg: res.data.message
                    })
                }
            },
            fail() {
                cb && cb.fail({
                    code: "000000",
                    msg: "异常网络"
                })
            }
        }
        wx.request(options)
        return this
    }
}

exports = module.exports = new API
