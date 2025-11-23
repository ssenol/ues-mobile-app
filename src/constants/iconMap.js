export const icons = {
  user: require('../../assets/icons/user.png'),
  password: require('../../assets/icons/password.png'),
  faceId: require('../../assets/icons/faceId.png'),
  touchId: require('../../assets/icons/touchId.png'),
  noti: require('../../assets/icons/noti.png'),
  back: require('../../assets/icons/back.png'),
  search: require('../../assets/images/search.png'),
  info: require('../../assets/icons/info.png'),
  // Goal progress ikonları
  goalGreen: require('../../assets/icons/goalGreen.png'),
  goalOrange: require('../../assets/icons/goalOrange.png'),
  goalRed: require('../../assets/icons/goalRed.png'),
  // Tabbar ikonları
  tabHome: require('../../assets/icons/home.png'),
  tabAssignment: require('../../assets/icons/assignment.png'),
  tabNotification: require('../../assets/icons/notification.png'),
  tabProfile: require('../../assets/icons/profile.png'),
  tabCompleted: require('../../assets/icons/completed.png'),
  // Yeni kart ikonları
  speechOnTopic: require('../../assets/icons/SpeechonTopic.png'),
  readAloud: require('../../assets/icons/ReadAloud.png'),
  sentences: require('../../assets/icons/sentences.png'),
  words: require('../../assets/icons/words.png'),
  solved: require('../../assets/icons/solved.png'),
  cefr: require('../../assets/icons/cefr.png'),
  topic: require('../../assets/icons/topic.png'),
  //
  filter: require('../../assets/icons/filter.png'),
  date: require('../../assets/icons/date.png'),
  type: require('../../assets/icons/type.png'),
  score: require('../../assets/icons/score.png'),
  bigmic: require('../../assets/icons/big-mic.png'),
  report: require('../../assets/icons/report.png'),
  // report
  report1: require('../../assets/icons/report1.png'),
  report2: require('../../assets/icons/report2.png'),
  report3: require('../../assets/icons/report3.png'),
  report4: require('../../assets/icons/report4.png'),
  time: require('../../assets/icons/time.png'),
  // profile
  school: require('../../assets/icons/school.png'),
  campus: require('../../assets/icons/campus.png'),
  classroom: require('../../assets/icons/classroom.png'),
  // report success
  bigcheck: require('../../assets/icons/big-check.png'),
  // record
  record: require('../../assets/icons/record.png'),
  play: require('../../assets/icons/play.png'),
  pause: require('../../assets/icons/pause.png'),
  recorddone: require('../../assets/icons/record-done.png'),
  close: require('../../assets/icons/close.png'),

};

export const getIconSource = (name) => icons[name] ?? null;
