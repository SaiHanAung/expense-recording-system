import {
  initializeApp
} from "https://www.gstatic.com/firebasejs/9.20.0/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/9.20.0/firebase-auth.js";
import {
  getDatabase,
  set,
  ref,
  update,
  onValue
} from "https://www.gstatic.com/firebasejs/9.20.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyDAAqGV8uZ-ujXky3KNpoW6aEdEdN8-YF4",
  authDomain: "sai-dev-4d945.firebaseapp.com",
  projectId: "sai-dev-4d945",
  storageBucket: "sai-dev-4d945.appspot.com",
  messagingSenderId: "301392195652",
  appId: "1:301392195652:web:9f102e7e33ed7323ee0c11",
  measurementId: "G-RR8EJMHZVQ"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth();
const database = getDatabase(app);

const thaiMonth = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
]

const vm = Vue.createApp({
  data() {
    return {
      email: '',
      password: '',
      isLoggedIn: false,
      isLoading: false,
      see: {},
      input: {},
      now: {
        full: moment(),
        month: moment().format("MM-YYYY")
      },
      thaiMonth: thaiMonth,
      expenses: []
    }
  },
  methods: {
    fillComma(number) {
      return number ? number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") : ""
    },
    initPieChart() {
      let dom = document.getElementById('chart-container');
      let myChart = echarts.init(dom, null, {
        renderer: 'canvas',
        useDirtyRect: false
      });

      let option = {
        title: {
          text: 'รายจ่ายแยกตามประเภท',
          subtext: `เดือน${thaiMonth[(new Date()).getMonth()]}`,
          left: 'center'
        },
        tooltip: {
          trigger: 'item',
          formatter: '{b} : {c} บาท ({d}%)'
        },
        legend: {
          bottom: 10,
          left: 'center',
          data: this.filteredPiechart.map(el => el.name)
        },
        series: [{
          type: 'pie',
          radius: '65%',
          center: ['50%', '50%'],
          selectedMode: 'single',
          data: this.filteredPiechart || [],
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: 'rgba(0, 0, 0, 0.5)'
            }
          }
        }]
      };

      if (option && typeof option === 'object') {
        myChart.setOption(option);
      }

      // myChart._chartsMap["_ec_\u0000series\u00000\u00000_series.pie"]._data._store._chunks[0][0] += 100
      // c(myChart._chartsMap["_ec_\u0000series\u00000\u00000_series.pie"]._data._store._chunks[0])
      window.addEventListener('resize', myChart.resize);
    },
    checkAuth() {
      onAuthStateChanged(auth, (user) => {
        if (user) {
          // User is signed in, see docs for a list of available properties
          // https://firebase.google.com/docs/reference/js/firebase.User
          const uid = user.uid;
          // this.getData()
          this.isLoggedIn = true

          // const starCountRef = ref(database, 'users', {
          //     accessToken: user.accessToken
          // });
          // onValue(starCountRef, (snapshot) => {
          //     const data = snapshot.val();
          //     c("data", data)
          // })
        } else {
          // User is signed out
          // ...
        }
      });
    },
    signIn() {
      // createUserWithEmailAndPassword(auth, this.email, this.password)
      //     .then((userCredential) => {

      //         const user = userCredential.user;

      //         set(ref(database, 'users/' + user.uid), {
      //                 email: this.email,
      //                 password: this.password
      //             })
      //             .then(() => {
      //                 alert('user created successfully')
      //             })
      //             .catch((error) => {
      //                 alert(error)
      //             });
      //     })
      //     .catch((error) => {
      //         const errorCode = error.code;
      //         const errorMessage = error.message;
      //         // ..
      //         alert(errorMessage)
      //     });
      signInWithEmailAndPassword(auth, this.email, this.password)
        .then((userCredential) => {
          // Signed in 
          const user = userCredential.user;
          const time = new Date()
          this.getData()
          this.isLoggedIn = true

          // update(ref(database, 'users/' + user.uid), {
          //         last_login: time
          //     })
          //     .then(() => {
          //         alert('user logged in successfully')
          //     })
          //     .catch((error) => {
          //         alert(error)
          //     });
        })
        .catch((error) => {
          const errorCode = error.code;
          const errorMessage = error.message;
          alert("อีเมลหรือรหัสผ่านผิด")
        });

    },
    getData() {
      const starCountRef = ref(database, 'expenses');
      onValue(starCountRef, (snapshot) => {
        this.expenses = snapshot.val()
      })
    },
    updateList(month = this.now.month) {
      let data = this.expenses[month],
        index = this.see.delIndex

      if (
        [
          this.input.name, this.input.type, this.input.income, this.input.expenses
        ]
          .some(el => el != null)
      ) {
        data.push({
          date: this.now.full.format("DD-MM-YYYY"),
          name: this.input.name,
          type: this.input.type,
          income: this.input.income || 0,
          expenses: this.input.expenses || 0
        })
      } else {
        // DELETE
        let text = `ต้องการลบ ${data[index].name} ${data[index].income || data[index].expenses} บาทใช่มั้ย`,
          isConfirm = window.confirm(text)

        if (isConfirm) data.splice(index, 1)
      }

      update(ref(database, 'expenses/'), {
        [month]: data
      })
        .then(() => {
          $('#add-data-modal').modal('hide')
          this.getData()
          this.input = {}
        })
        .catch((error) => {
          alert(error)
        })
    },
    addList() {
      let isAdd = false

      if (this.expenses) {
        Object.keys(this.expenses).forEach(month => {
          if (month == this.now.month) this.updateList()
          else isAdd = true
        })
      } else isAdd = true

      if (isAdd) {
        set(ref(database, 'expenses/' + this.now.month), [{
          date: this.now.full.format("DD-MM-YYYY"),
          name: this.input.name,
          type: this.input.type,
          income: this.input.income || 0,
          expenses: this.input.expenses || 0
        }])
          .then(() => {
            $('#add-data-modal').modal('hide')
            this.getData()
            this.input = {}
          })
          .catch((error) => {
            alert(error)
          })
      }
    }
  },
  computed: {
    filteredData() {
      // return this.expenses?.[this.now.month]?.reverse() || []
      return this.expenses?.[this.now.month]?.sort((prev, cur) => {
        let splitDate1 = prev.date.split(/-/g),
          splitDate2 = cur.date.split(/-/g),
          engDate1 = `${splitDate1[2]}/${splitDate1[1]}/${splitDate1[0]}`,
          engDate2 = `${splitDate2[2]}/${splitDate2[1]}/${splitDate2[0]}`,
          prevDate = new Date(engDate1),
          curDate = new Date(engDate2)

        return curDate.getTime() - prevDate.getTime();
      }) || []
    },
    filteredPiechart() {
      let data = []

      this.filteredData.forEach(el => {
        if (el.type !== "รายรับ") {
          let found = false

          data.forEach((d, di) => {
            if (el.type === d.name) {
              found = true
              data[di].value += el.expenses
            }
          })

          if (!found) {
            data.push({
              name: el.type,
              value: el.expenses
            })
          }
        }
      })

      return data
    }
  },
  updated() {
    if (this.isLoading) this.initPieChart()
  },
  watch: {
    "isLoggedIn"(newVal) {
      if (newVal) {
        this.getData()
      }
    },
    "filteredPiechart"(newVal) {
      if (newVal) {
        this.isLoading = true
      }
    }
  },
  async mounted() {
    await this.checkAuth()
  },
}).mount("#app")