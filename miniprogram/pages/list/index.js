/* 待办列表首页 */
import { todayHasTargetWater, getDate } from '../../tools/index.js'
const computedBehavior = require('miniprogram-computed').behavior

Page({
  // 存储请求结果
  data: {
    todos: [], // 用户的所有待办事项
    pending: [], // 未完成待办事项
    finished: [], // 已完成待办事项
    urination: [], // 用户的所有导尿计划
    urinationPending: [], // 未完成导尿事项
    urinationFinished: [], // 已完成导尿事项
    totalWater: null,
    actualWater: null,
    percent: 0,
    tabIndex: 0,
    indirectNum: 0, // z间导次数
    indirectTotal:0, // 间导总量
    selfNum:0, // 自主次数
    selfTotal:0 // 自主总量
  },
  behaviors: [computedBehavior],
  computed: {
    percent(data) {
      return (data.actualWater / data.totalWater) * 100
    }
  },
  // 静默获取授权
  // 即使用户选择了总是允许，每发送一次订阅消息，都会消耗一次授权，并非永久有效的。所以需要尽可能多的收集用户授权次数
  slienceGetSubscribeAuth() {
    const _this = this
    wx.getSetting({
      withSubscriptions: true,
      success(res) {
        if (res.subscriptionsSetting.mainSwitch) {
          console.log('订阅消息总开关已打开')
          _this.testRequestSubscribe();
        } else {
          console.log('订阅消息总开关未打开')
        }
        if (res.subscriptionsSetting.itemSettings) {
          console.log('订阅消息详细设置：', res.subscriptionsSetting.itemSettings)
        }
      }
    })
  },
  testRequestSubscribe() {
    // !FIXME
    const templateId = require('../../envList.js').templateId || '' // 读取 envlist 文件
    wx.requestSubscribeMessage({
      tmplIds: [templateId],
      success(res) {
        if (res[templateId] === 'reject') {
          wx.showToast({
            title: '将无法收到提醒',
            icon: 'error',
            duration: 2000
          })
        }
      },
      fail(err) {
        console.log('订阅消息失败：', err)
      }
    })
  },
  updateWave() {
    this.onShow()
  },
  onShow() {
    if (this.data.tabIndex === 0) {
      // 通过云函数调用获取用户 _openId
    getApp().getOpenId().then(async openid => {
      // 根据 _openId 数据，查询并展示待办列表
      const db = await getApp().database()
      db.collection(getApp().globalData.collection).orderBy('created_at', 'desc').where({
        _openid: openid,
        type: 'todo'
      }).get().then(res => {
        const {
          data
        } = res
        // 存储查询到的数据
        this.setData({
          // data 为查询到的所有待办事项列表
          todos: data,
          // 通过 filter 函数，将待办事项分为未完成和已完成两部分
          pending: data.filter(todo => todo.status === 0),
          finished: data.filter(todo => todo.status === 1)
        })
        if (!data.length) return;
        const { frequency, record } = data[0] || {}
        if (frequency && todayHasTargetWater(frequency)) {
          const totalWater = record.reduce((acc, cur) => acc + (cur.targetDrink || 0), 0)
          this.setData({
            totalWater
          })
          // 查询今天实际已经喝了多少
          db.collection(getApp().globalData.collection_daily).where({
            _openid: openid,
            date: getDate()
          }).get().then(res => {
            const { data } = res
            if (data.length) {
              const { records } = data[0]
              const actualWater = records.reduce((acc, cur) => acc + (cur.num || 0), 0)
              this.setData({
                actualWater
              })
            }
          })
        }

      })

    })
    } else {
      this.getUrinationInfo()
      this.getUrinationInfoDashboard()
    }

    // 配置首页左划显示的星标和删除按钮
    this.setData({
      slideButtons: [{
        extClass: 'starBtn',
        text: '星标',
        src: '../../images/list/star.png'
      }, {
        type: 'warn',
        text: '删除',
        src: '../../images/list/trash.png'
      }],
    })
  },
  // 获取导尿计划
  async getUrinationInfo() {
    // 根据 _openId 数据，查询并展示待办列表
    const openid = await getApp().getOpenId()
    const db = await getApp().database()
    db.collection(getApp().globalData.collection).where({
      _openid: openid,
      type: 'urination'
    }).get().then(res => {
      const {
        data
      } = res
      // 存储查询到的数据
      this.setData({
        // data 为查询到的所有待办事项列表
        urination: data,
        // 通过 filter 函数，将待办事项分为未完成和已完成两部分
        urinationPending: data.filter(todo => todo.status === 0),
        urinationFinished: data.filter(todo => todo.status === 1)
      })
    })
  },
  // 获取今天导尿次数和总量
  async getUrinationInfoDashboard() {
    const openid = await getApp().getOpenId()
    const db = await getApp().database()
    db.collection(getApp().globalData.collection_urination_daily).where({
      userId: openid,
      date: getDate()
    }).get().then(res => {
      const {
        data: [target = {}, ...rest]
      } = res
      const records = target.records || []
      // 分出间导和自主的次数和总量
      const indirectNum = records.filter(item => item.type === 0).length
      const indirectTotal = records.filter(item => item.type === 0).reduce((acc, cur) => acc + Number(cur.num), 0)
      const selfNum = records.filter(item => item.type === 1).length
      const selfTotal = records.filter(item => item.type === 1).reduce((acc, cur) => acc + Number(cur.num), 0)
      this.setData({
        indirectNum,
        indirectTotal,
        selfNum,
        selfTotal
      })
    })
  },

  onLoad(options) {
    this.setData({
      tabIndex: Number(options.tab || 0)
    })
    // 手动触发测试订阅消息提醒
    // getApp().sendSubscribeMessage().then(res => {
    //   console.log(res)
    // })
  },

  // 切换tab
  onChangeTab(e) {
    this.setData({
      tabIndex: e.detail.index
    })
    if (e.detail.index === 0) {
      this.onShow()
    } else {
      this.getUrinationInfoDashboard()
      this.getUrinationInfo()
    }
  },
  // 响应左划按钮事件
  async slideButtonTap(e) {
    // 得到触发事件的待办序号
    const {
      index
    } = e.detail
    // 根据序号获得待办对象
    const todoIndex = e.currentTarget.dataset.index
    const todo = this.data.tabIndex === 0 ? this.data.pending[todoIndex] : this.data.urinationPending[todoIndex]
    const db = await getApp().database()
    // 处理星标按钮点击事件
    if (index === 0) {
      // 根据待办的 _id 找到并反转星标标识
      db.collection(getApp().globalData.collection).where({
        _id: todo._id
      }).update({
        data: {
          star: !todo.star
        }
      })
      // 更新本地数据，触发显示更新
      todo.star = !todo.star
      if (this.data.tabIndex === 0) {
        this.setData({
          pending: this.data.pending
        })
      } else {
        this.setData({
          urinationPending: this.data.urinationPending
        })

      }
    }
    // 处理删除按钮点击事件
    if (index === 1) {
      // 根据待办的 _id 找到并删除待办记录
      db.collection(getApp().globalData.collection).where({
        _id: todo._id
      }).remove()
      // 更新本地数据，快速更新显示
      const temp = this.data.tabIndex === 0 ? this.data.pending : this.data.urinationPending
      temp.splice(todoIndex, 1)
      if (this.data.tabIndex === 0) {
        this.setData({
          pending: temp
        })
      } else {
        this.setData({
          urinationPending: temp
        })
      }
      // 如果删除完所有事项，刷新数据，让页面显示无事项图片
      if (this.data.pending.length === 0 && this.data.finished.length === 0) {
        this.setData({
          todos: [],
          pending: [],
          finished: []
        })
      }
      if (this.data.urinationPending.length === 0 && this.data.urinationFinished.length === 0) {
        this.setData({
          urination: [],
          urinationPending: [],
          urinationFinished: []
        })
      }
    }
  },

  // 点击左侧单选框时，切换待办状态
  async finishTodo(e) {
    // 根据序号获得触发切换事件的待办
    const todoIndex = e.currentTarget.dataset.index
    const todo = (this.data.tabIndex === 0 ? this.data.pending : this.data.urinationPending)[todoIndex]
    const db = await getApp().database()
    // 根据待办 _id，获得并更新待办事项状态
    db.collection(getApp().globalData.collection).where({
      _id: todo._id
    }).update({
      // status == 1 表示待办已完成，不再提醒
      // status == 0 表示待办未完成，每天提醒
      data: {
        status: 1
      }
    })
    // 快速刷新数据
    todo.status = 1
    this.setData({
      pending: this.data.todos.filter(todo => todo.status === 0),
      finished: this.data.todos.filter(todo => todo.status === 1),
      urinationPending: this.data.urination.filter(todo => todo.status === 0),
      urinationFinished: this.data.urination.filter(todo => todo.status === 1)
    })
  },

  // 同上一函数，将待办状态设置为未完成
  async resetTodo(e) {
    const todoIndex = e.currentTarget.dataset.index
    const todo = (this.data.tabIndex === 0 ? this.data.finished : this.data.urinationFinished)[todoIndex]
    const db = await getApp().database()
    db.collection(getApp().globalData.collection).where({
      _id: todo._id
    }).update({
      data: {
        status: 0
      }
    })
    todo.status = 0
    this.setData({
      pending: this.data.todos.filter(todo => todo.status === 0),
      finished: this.data.todos.filter(todo => todo.status === 1),
      urinationPending: this.data.urination.filter(todo => todo.status === 0),
      urinationFinished: this.data.urination.filter(todo => todo.status === 1)
    })
  },

  // 跳转响应函数
  toFileList(e) {
    const todoIndex = e.currentTarget.dataset.index
    const todo = this.data.pending[todoIndex]
    wx.navigateTo({
      url: '../file/index?id=' + todo._id,
    })
  },

  toDetailPage(e) {
    const todoIndex = e.currentTarget.dataset.index
    const todo = (this.data.tabIndex === 0 ? this.data.pending : this.data.urinationPending)[todoIndex]
    // wx.navigateTo({
    //   url: `../${this.data.tabIndex === 0 ? 'detail' : 'edit_urination'}/index?id=` + todo._id,
    // })
    wx.navigateTo({
      url: `../${this.data.tabIndex === 0 ? 'edit' : 'edit_urination'}/index?id=` + todo._id,
    })
  },
  // 只读模式查看详情页，无法编辑
  toViewDetailPage(e) {
    const todoIndex = e.currentTarget.dataset.index
    const todo = (this.data.tabIndex === 0 ? this.data.finished : this.data.urinationFinished)[todoIndex]
    wx.navigateTo({
      url: `../${this.data.tabIndex === 0 ? 'detail' : 'edit_urination'}/index?id=` + todo._id + '&readonly=true',
    })
  },

  toAddPage() {
    wx.navigateTo({
      url: '../../pages/add/index',
    })
  },

  updateUrinationInfo() {
    this.getUrinationInfoDashboard()
  }
})