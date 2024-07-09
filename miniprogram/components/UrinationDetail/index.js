import { getDate } from "../../tools/index.js"

Component({
  behaviors: ['wx://component-export'],
  options: {
    multipleSlots: true, // 在组件定义时的选项中启用多slot支持
    styleIsolation: 'shared',
  },
  export() {
    return {
      data: {
        title: this.data.title, // 待办标题
        desc: this.data.desc, // 待办描述
        // files: this.data.files, // 待办附件
        status: this.data.status, // 待办状态
        record: this.data.record,
        star: this.data.star,
        type: 'urination',
        memo: this.data.memo,
        buyItemsDesc: this.data.buyItemsDesc,
        frequency: this.data.intervalsIndex == 0 ? 'everyday' : this.data.intervalsIndex == 1 ? 'workday' : this.data.selectdDaily.join(','),
        urinationInput: this.data.urinationInput

      },
      resetUrination: this.resetUrination.bind(this),
      setDetailData: this.setUrinationData.bind(this),
    }
  },
  properties: {
    data: {
      type: Object,
      value: {},
    },
    onComplete: {
      type: Function,
      value: () => {},
    }
  },
  data: {
    editMode: false,
    urinationDialogShow: false,
    title: '',
    desc: '',
    buyItemsDesc: '',
    memo: '',
    // files: [],
    // fileName: '',
    statusOptions: ['未完成', '已完成'],
    intervalsReminderOptions: ['每天', '工作日', '自定义'],
    customDaily: ['星期一', '星期二', '星期三', '星期四', '星期五', '星期六', '星期日'],
    selectdDaily: ['星期一', '星期二', '星期三', '星期四', '星期五'],
    status: 0,
    intervalsIndex: 0,
    record: Array.from({ length: 24 }, (v, i) => ({
      value: i + 1,
      checked: false
    })),
    urinationInput: {
      time: '',
      num: '',
      date: getDate()
    },
    urinationTypeOptions: ['间导', '自主'],
    typeDefaultIndex: 0, // 默认是间导
  },
  methods: {
    onBuyItemsInput(event) {
      this.setData({
        buyItemsDesc: event.detail.value
      })
    },
    onMemoInput(event) {
      this.setData({
        memo: event.detail.value
      })
    },
    onChangeType(event) {
      this.setData({
        typeDefaultIndex: event.detail.value === '间导' ? 0 : 1
      })
    },
    setUrinationData(data) {
      this.setData({
        ...data
      })
    },
    onTitleInput(e) {
      this.setData({
        title: e.detail.value
      })
    },
    onDescInput(e) {
      this.setData({
        desc: e.detail.value
      })
    },
    changeCheckbox(event) {
      if (!event.target.dataset.extraParam) {
        return
      }
      const index = event.target.dataset.extraParam.value - 1
      this.data.record[index].checked = event.detail;
      this.setData({
        record: this.data.record
      })
    },
    urinationInputDialogVisible(boolean = true) {
      this.setData({
        urinationDialogShow: boolean
      })
    },
    // 选择计划提醒频率
    onChooseIntervals(e) {
      console.log(e.detail.value)
      this.setData({
        intervalsIndex: Number(e.detail.value),
      })
    },
    // 设计计划提醒的时间
    onChangeCustomDaily(e) {
      this.setData({
        selectdDaily: e.detail,
      })
    },
    inputUrinationComplete(data) {
      const { time, num } = data.detail
      // 默认3小时提醒一次吧
       let record = Array.from({ length: 24 }, (v, i) => ({
        value: i + 1,
        checked: this.calculateRemindHours(i + 1, time, 3)
      }))
      // 根据时间和残余量，设置提醒间隔
      if (num > 0 && num < 150) {
        // 每4小时提醒一次
        record = Array.from({ length: 24 }, (v, i) => ({
          value: i + 1,
          checked: this.calculateRemindHours(i + 1, time, 4)
        }))

      } else if (num >= 150 && num < 300) {
        // 每3小时提醒一次
        record = Array.from({ length: 24 }, (v, i) => ({
          value: i + 1,
          checked: this.calculateRemindHours(i + 1, time, 3)
        }))

      } else if (num >= 300 && num < 450) {
        // 每2小时提醒一次
        record = Array.from({ length: 24 }, (v, i) => ({
          value: i + 1,
          checked: this.calculateRemindHours(i + 1, time, 2)
        }))
      }
      this.setData({
        record,
        urinationInput: {
          ...data.detail,
          date: getDate()
        }
      })
      this.urinationInputDialogVisible(false)
    },
    inputUrinationCancel() {
      this.urinationInputDialogVisible(false)
    },
    // 根据时间和残余量，计算哪些小时需要提醒
    calculateRemindHours(scheduleHour, startHour, interval = 4) {
      if (scheduleHour < 6 || scheduleHour > 22) return false
      if ((scheduleHour - startHour) % interval === 0) return true
      return false
    },
    resetUrination() {
      this.setData({
        editMode: false,
        urinationDialogShow: false,
        title: '',
        desc: '',
        buyItemsDesc: '',
        memo: '',
        // files: [],
        // fileName: '',
        statusOptions: ['未完成', '已完成'],
        urinationTypeOptions: ['间导', '自主'],
        typeDefaultIndex: 0, // 默认是间导
        intervalsReminderOptions: ['每天', '工作日', '自定义'],
        customDaily: ['星期一', '星期二', '星期三', '星期四', '星期五', '星期六', '星期日'],
        selectdDaily: ['星期一', '星期二', '星期三', '星期四', '星期五'],
        status: 0,
        intervalsIndex: 0,
        record: Array.from({ length: 24 }, (v, i) => ({
          value: i + 1,
          checked: false
        })),
        urinationInput: {
          time: '',
          num: '',
          data: ''
        }
      })
    },
  }
})