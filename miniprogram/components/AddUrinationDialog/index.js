Component({
  properties: {
    show: {
      type: Boolean,
      value: true,
    },
  },
  data: {
    timeColumns: Array.from({ length: 24 }, (v, i) => `${i + 1} 点`),
    numberColumns: Array.from({ length: 20 }, (v, i) => `${(i + 1) * 50} ml`),
    // 24小时制，计算最近的整数点是什么
    timeDefaultIndex: Math.max(0, new Date().getHours() - 1),
    numDefaultIndex: 3,
    time: new Date().getHours(),
    num: 200
  },
  methods: {
    save() {
      console.log('时间和量', this.data.time, this.data.num)
      this.triggerEvent('onComplete', { time: Number(this.data.time), num: Number(this.data.num) })
    },
    onClose() {
      this.triggerEvent('onCancel')
    },
    onChangeTime(event) {
      this.setData({
        time: event.detail.value.replace(' 点', '')
      })
    },
    onChangeNum(event) {
      this.setData({
        num: event.detail.value.replace(' ml', '')
      })
    },
  }
})