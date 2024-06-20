import { getDate } from '../../tools/index.js';

const computedBehavior = require('miniprogram-computed').behavior

Component({
  behaviors: [computedBehavior],
  properties: {
    percent: {
      type: Number,
      value: 0
    },
  },
  data: {
    top: 0,
    show: false,
    timeColumns: Array.from({ length: 24 }, (v, i) => `${i + 1} 点`),
    numberColumns: Array.from({ length: 20 }, (v, i) => `${(i + 1) * 50} ml`),
    // 24小时制，计算最近的整数点是什么
    timeDefaultIndex: Math.max(0, new Date().getHours() - 1),
    numDefaultIndex: 3,
    time: new Date().getHours(),
    num: 200
  },
  watch: {
    'percent': function (percent) {
      // 取离percent最近的那个整十
      let top = Math.round(percent / 10) * 10
      if (top < 0) top = 0;
      if (top > 100) top = 100;
      this.setData({
        top
      })
    }
  },
  methods: {
    addRecord() {
      this.setData({
        show: true
      })
    },
    onClose() {
      this.setData({
        show: false
      })
    },
    onChangeTime(event) {
      this.setData({
        time: event.detail.value.replace(' 点', '')
      })
    },
    onChangeNum(event) {
      console.log('onChangeNum', event.detail)
      this.setData({
        num: event.detail.value.replace(' ml', '')
      })
    },
    save () {
      const _this = this;
      // this.setData({
      //   show: false
      // })
      if (!this.data.time || !this.data.num) {
        wx.showToast({
          title: '请填写时间或饮水量',
          icon: 'none'
        })
        return
      }
      getApp().getOpenId().then(async openid => {
        const db = await getApp().database()
        // db.collection(getApp().globalData.collection_daily)
        // .add({
        //   data: {

        //   }
        // })
        db.collection(getApp().globalData.collection_daily).where({
          _openid: openid,
          date: getDate()
        }).get().then(res => {
          const {
            data
            } = res
          if (!data.length) {
            // 需要新建
            db.collection(getApp().globalData.collection_daily)
              .add({
                data: {
                  userId: openid,
                  date: getDate(),
                  records: [{
                    time: Number(this.data.time),
                    num: Number(this.data.num)
                  }]
                }
              })
              .then(() => {
                wx.showToast({
                  title: '保存成功',
                  icon: 'success'
                })
                this.setData({
                  show: false
                })
                // 触发父组件的更新
                _this.triggerEvent('update')
              }).catch(err => {
                console.log(err)
                wx.showToast({
                  title: '保存失败，请稍后重试',
                  icon: 'error',
                  duration: 2000,
                })
              })
          } else {
            // 已经存在
            const target = data[0]
            delete target._openid
            delete target._id
            const records = target.records || []
            // 该时间点是否已经记录过，如果记录过，则叠加二者之和
            const targetIndex = records.findIndex(item => item.time === Number(this.data.time))
            if (targetIndex > -1) {
              records[targetIndex].num += Number(this.data.num)
            } else {
              records.push({
                time: Number(this.data.time),
                num: Number(this.data.num)
              })
            }
            db.collection(getApp().globalData.collection_daily).where({
              userId: target._id,
              date: getDate()
            }).update({
              data: {
                ...target,
                records
              }
            }).then(() => {
              wx.showToast({
                title: '保存成功',
                icon: 'success'
              })
              this.setData({
                show: false
              })
              // 触发父组件的更新
              _this.triggerEvent('update')
            }).catch(err => {
              console.log(err)
              wx.showToast({
                title: '保存失败，请稍后重试',
                icon: 'error',
                duration: 2000,
              })
            })
          }
        })
      })

    }
  }
})