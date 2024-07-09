App({
  async onLaunch() {
    this.initcloud()

    this.globalData = {
      // 用于存储待办记录的集合名称
      collection: 'todo',
      collection_daily: 'daily',
      collection_urination_daily: 'daily_urination',
      collection_urination: 'urination',
      // 最大文件上传数量
      fileLimit: 2
    }
  },

  flag: false,
  /**
   * 初始化云开发环境（支持环境共享和正常两种模式）
   */
  async initcloud() {
    const shareinfo = wx.getExtConfigSync() // 检查 ext 配置文件
    const normalinfo = require('./envList.js').envList || [] // 读取 envlist 文件
    if (shareinfo.envid != null) { // 如果 ext 配置文件存在，环境共享模式
      this.c1 = new wx.cloud.Cloud({ // 声明 cloud 实例
        resourceAppid: shareinfo.appid,
        resourceEnv: shareinfo.envid,
      })
      // 装载云函数操作对象返回方法
      this.cloud = async function () {
        if (this.flag != true) { // 如果第一次使用返回方法，还没初始化
          await this.c1.init() // 初始化一下
          this.flag = true // 设置为已经初始化
        }
        return this.c1 // 返回 cloud 对象
      }
    } else { // 如果 ext 配置文件存在，正常云开发模式
      if (normalinfo.length != 0 && normalinfo[0].envId != null) { // 如果文件中 envlist 存在
        wx.cloud.init({ // 初始化云开发环境
          traceUser: true,
          env: normalinfo[0].envId
        })
        // 装载云函数操作对象返回方法
        this.cloud = () => {
          return wx.cloud // 直接返回 wx.cloud
        }
      } else { // 如果文件中 envlist 不存在，提示要配置环境
        this.cloud = () => {
          wx.showModal({
            content: '当前小程序没有配置云开发环境，请在 envList.js 中配置你的云开发环境',
            showCancel: false
          })
          throw new Error('当前小程序没有配置云开发环境，请在 envList.js 中配置你的云开发环境')
        }
      }
    }
  },

  // 获取云数据库实例
  async database() {
    return (await this.cloud()).database()
  },

  // 上传文件操作封装
  async uploadFile(cloudPath, filePath) {
    return (await this.cloud()).uploadFile({
      cloudPath,
      filePath
    })
  },

  // 下载文件操作封装
  async downloadFile(fileID) {
    return (await this.cloud()).downloadFile({
      fileID
    })
  },

  // 获取用户唯一标识，兼容不同环境模式
  async getOpenId() {
    const {
      result: {
        openid,
        fromopenid
      }
    } = await (await this.cloud()).callFunction({
      name: 'getOpenId'
    }).catch(e => {
      let flag = e.toString()
      flag = flag.indexOf('FunctionName') == -1 ? flag : '请在cloudfunctions文件夹中getOpenId上右键，创建部署云端安装依赖，然后再次体验'
      wx.hideLoading()
      wx.showModal({
        content: flag, // 此提示可以在正式时改为 "网络服务异常，请确认网络重新尝试！"
        showCancel: false
      })
      throw new Error(flag)
    })
    if (openid !== "") return openid
    return fromopenid
  },

  // // 发送订阅消息
  // // 自定义云函数
  async sendSubscribeMessage() {
    const openId = await this.getOpenId()
    const cloud = await this.cloud()
    cloud.callFunction({
      name: 'sendSubscribeMessage',
      data: {
        openid: openId,
      }
    }).then(res => {
      console.log('发送订阅消息成功', res)
    }).catch(e => {
      console.log('发送订阅消息失败', e)
    })
   },

  //   // 发送订阅消息
  //   // 微信云模块
  // async sendSubscribeMessage() {
  //   const openId = await this.getOpenId()
  //   const cloud = await this.cloud()
  //   cloud.callFunction({
  //     name: 'cloudbase_module',
  //     data: {
  //       name: 'wx_message_send_message',
  //       data: {
  //         template_id: "awvwR6aQIE_G1qw0lvmZKQ1agT4-kX3RbDjne5zh8nQ", // 所需下发的订阅模板id
  //         page: "pages/list/index", //点击模板卡片后的跳转页面，仅限本小程序内的页面。支持带参数,（示例index?foo=bar）。该字段不填则模板无跳转
  //         touser: openId, //接收者（用户）的 openid
  //         data:{ "thing1": { "value": '饮水提醒' }, "time2": { "value":  new Date().toLocaleDateString() },"thing4": { "value": 123 },"thing5": { "value": '测试计划1' }}, //模板内容，格式形如 { "key1": { "value": any }, "key2": { "value": any } }的object
  //         miniprogram_state:"trial", //跳转小程序类型：developer为开发版；trial为体验版；formal为正式版；默认为正式版
  //         lang:"zh_CN" //进入小程序查看”的语言类型，支持zh_CN(简体中文)、en_US(英文)、zh_HK(繁体中文)、zh_TW(繁体中文)，默认为zh_CN
  //       },
  //     },
  //     // triggers: [
  //     //   {
  //     //     // name: 触发器的名字，规则见下方说明
  //     //     "name": "myTrigger",
  //     //     // type: 触发器类型，目前仅支持 timer (即 定时触发器)
  //     //     "type": "timer",
  //     //     // config: 触发器配置，在定时触发器下，config 格式为 cron 表达式，规则见下方说明
  //     //     "config": "0 */2 * * * * *"
  //     //   }
  //     // ],
  //     success: (res) => {
  //       console.log('综合结果', res.result.result);
  //       console.log('错误码', res.result.errcode);
  //       console.log('错误信息', res.result.errmsg);
  //     },
  //   })
  //  }

})