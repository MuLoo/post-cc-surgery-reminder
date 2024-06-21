/* 待办列表首页 */
import { todayHasTargetWater, getDate } from '../../tools/index.js'
const computedBehavior = require('miniprogram-computed').behavior

Page({
  // 存储请求结果
  data: {
    todos: [], // 用户的所有待办事项
    pending: [], // 未完成待办事项
    finished: [], // 已完成待办事项
    totalWater: null,
    actualWater: null,
    percent: 0
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
        console.log('res', res)
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
    const templateId = require('../../envList.js').templateId || '' // 读取 envlist 文件
    wx.requestSubscribeMessage({
      tmplIds: [templateId],
      success(res) {
        console.log(res)
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
        // wx.showToast({
        //   title: '将无法收到提醒',
        //   icon: 'error',
        //   duration: 2000
        // })
      }
    })
  },
  updateWave() {
    this.onShow()
  },
  onShow() {
    // 通过云函数调用获取用户 _openId
    getApp().getOpenId().then(async openid => {
      // 根据 _openId 数据，查询并展示待办列表
      const db = await getApp().database()
      db.collection(getApp().globalData.collection).where({
        _openid: openid
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

  // 手动触发测试订阅消息提醒
  // onLoad() {
  //   getApp().sendSubscribeMessage().then(res => {
  //     console.log(res)
  //   })
  // },

  // 切换tab
  onChangeTab(e) {
    console.log('onChangeTab', e.detail)
  },
  // 响应左划按钮事件
  async slideButtonTap(e) {
    // 得到触发事件的待办序号
    const {
      index
    } = e.detail
    // 根据序号获得待办对象
    const todoIndex = e.currentTarget.dataset.index
    const todo = this.data.pending[todoIndex]
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
      this.setData({
        pending: this.data.pending
      })
    }
    // 处理删除按钮点击事件
    if (index === 1) {
      // 根据待办的 _id 找到并删除待办记录
      db.collection(getApp().globalData.collection).where({
        _id: todo._id
      }).remove()
      // 更新本地数据，快速更新显示
      this.data.pending.splice(todoIndex, 1)
      this.setData({
        pending: this.data.pending
      })
      // 如果删除完所有事项，刷新数据，让页面显示无事项图片
      if (this.data.pending.length === 0 && this.data.finished.length === 0) {
        this.setData({
          todos: [],
          pending: [],
          finished: []
        })
      }
    }
  },

  // 点击左侧单选框时，切换待办状态
  async finishTodo(e) {
    // 根据序号获得触发切换事件的待办
    const todoIndex = e.currentTarget.dataset.index
    const todo = this.data.pending[todoIndex]
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
      finished: this.data.todos.filter(todo => todo.status === 1)
    })
  },

  // 同上一函数，将待办状态设置为未完成
  async resetTodo(e) {
    const todoIndex = e.currentTarget.dataset.index
    const todo = this.data.finished[todoIndex]
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
      finished: this.data.todos.filter(todo => todo.status === 1)
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
    const todo = this.data.pending[todoIndex]
    wx.navigateTo({
      url: '../detail/index?id=' + todo._id,
    })
  },

  toAddPage() {
    wx.navigateTo({
      url: '../../pages/add/index',
    })
  }
})