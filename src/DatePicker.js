/*
*   This content is licensed according to the W3C Software License at
*   https://www.w3.org/Consortium/Legal/2015/copyright-software-and-document
*
*   File:   datepicker.js
*/
import CalendarButtonInput from './CalendarButtonInput'
import DatePickerDay from './DatepickerDay';
import { convertJSDayToDataDate, isLessThanMinDate, isGreaterThanMaxDate, dataDateFormat, splitDataDateAndCreateNewDate, today } from './Utilities';

// var CalendarButtonInput = CalendarButtonInput || {};
// var DatePickerDay = DatePickerDay || {};

var DatePicker = function (inputNode, buttonNode, dialogNode, dateFormat, minDate, maxDate, specifiedFocusDate, dateButtonClasses) {
  this.dayLabels = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  this.monthLabels = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  this.messageCursorKeys = 'Cursor keys can navigate dates';
  this.lastMessage = '';

  this.inputNode   = inputNode;
  this.buttonNode  = buttonNode;
  this.dialogNode  = dialogNode;
  this.messageNode = dialogNode.querySelector('.message');
  this.dateFormat = dateFormat.toLowerCase();
  this.minDate = minDate;
  this.maxDate = maxDate;
  this.specifiedFocusDate =specifiedFocusDate;
  this.dateButtonClasses = dateButtonClasses;
  console.log(`min-max date format inside datepicker constructor --> min-${minDate}, max-${maxDate}` );
  this.dateInput = new CalendarButtonInput(this.inputNode, this.buttonNode, this, this.dateFormat );

  this.MonthYearNode = this.dialogNode.querySelector('.monthYear');

  this.prevYearNode = this.dialogNode.querySelector('.prevYear');
  this.prevMonthNode = this.dialogNode.querySelector('.prevMonth');
  this.nextMonthNode = this.dialogNode.querySelector('.nextMonth');
  this.nextYearNode = this.dialogNode.querySelector('.nextYear');

  this.okButtonNode = this.dialogNode.querySelector('button[value="ok"]');
  this.cancelButtonNode = this.dialogNode.querySelector('button[value="cancel"]');

  this.tbodyNode = this.dialogNode.querySelector('table.dates tbody');

  this.lastRowNode = null;

  this.days = [];

  this.focusDay = new Date();
  this.selectedDay = new Date(0,0,1);

  this.isMouseDownOnBackground = false;

  this.keyCode = Object.freeze({
    'TAB': 9,
    'ENTER': 13,
    'ESC': 27,
    'SPACE': 32,
    'PAGEUP': 33,
    'PAGEDOWN': 34,
    'END': 35,
    'HOME': 36,
    'LEFT': 37,
    'UP': 38,
    'RIGHT': 39,
    'DOWN': 40
  });

};

DatePicker.prototype.init = function () {
  console.log('datePicker init called... ');
  this.dateInput.init();

  this.okButtonNode.addEventListener('click', this.handleOkButton.bind(this));
  this.okButtonNode.addEventListener('keydown', this.handleOkButton.bind(this));

  this.cancelButtonNode.addEventListener('click', this.handleCancelButton.bind(this));
  this.cancelButtonNode.addEventListener('keydown', this.handleCancelButton.bind(this));

  this.prevMonthNode.addEventListener('click', this.handlePreviousMonthButton.bind(this));
  this.nextMonthNode.addEventListener('click', this.handleNextMonthButton.bind(this));
  this.prevYearNode.addEventListener('click', this.handlePreviousYearButton.bind(this));
  this.nextYearNode.addEventListener('click', this.handleNextYearButton.bind(this));

  this.prevMonthNode.addEventListener('keydown', this.handlePreviousMonthButton.bind(this));
  this.nextMonthNode.addEventListener('keydown', this.handleNextMonthButton.bind(this));
  this.prevYearNode.addEventListener('keydown', this.handlePreviousYearButton.bind(this));

  this.nextYearNode.addEventListener('keydown', this.handleNextYearButton.bind(this));

  document.body.addEventListener('mousedown', this.handleBackgroundMouseDown.bind(this), true);
  document.body.addEventListener('mouseup', this.handleBackgroundMouseUp.bind(this), true);

  // Create Grid of Dates

  this.tbodyNode.innerHTML = '';
  var index = 0;
  for (var i = 0; i < 6; i++) {
    var row = this.tbodyNode.insertRow(i);
    this.lastRowNode = row;
    row.classList.add('dateRow');
    for (var j = 0; j < 7; j++) {
      var cell = document.createElement('td');
      cell.classList.add('dateCell');
      var cellButton = document.createElement('button');
      cellButton.classList.add('dateButton');
      var customdateButtonClassArray =  this.dateButtonClasses ? this.dateButtonClasses.split(' '): '';
      cellButton.classList.add(...customdateButtonClassArray);
      cell.appendChild(cellButton);
      row.appendChild(cell);
      var dpDay = new DatePickerDay(cellButton, this, index, i, j);
      dpDay.init();
      this.days.push(dpDay);
      index++;
    }
  }

  this.updateGrid();
  this.setFocusDay();
};

DatePicker.prototype.updateGrid = function () {
  console.log('----------calling update grid-------------');
  var i, flag;
  var fd = this.focusDay;

  this.MonthYearNode.innerHTML = this.monthLabels[fd.getMonth()] + ' ' + fd.getFullYear();

  var firstDayOfMonth = new Date(fd.getFullYear(), fd.getMonth(), 1);
  var daysInMonth = new Date(fd.getFullYear(), fd.getMonth() + 1, 0).getDate();
  var dayOfWeek = firstDayOfMonth.getDay();

  firstDayOfMonth.setDate(firstDayOfMonth.getDate() - dayOfWeek);

  var d = new Date(firstDayOfMonth);
  console.log('variable d in update grid--(first day of month)', d)

  for (i = 0; i < this.days.length; i++) {
    flag = d.getMonth() != fd.getMonth();
    this.days[i].updateDay(flag, d, this.minDate, this.maxDate);
    if ((d.getFullYear() == this.selectedDay.getFullYear()) &&
        (d.getMonth() == this.selectedDay.getMonth()) &&
        (d.getDate() == this.selectedDay.getDate())) {
      this.days[i].domNode.setAttribute('aria-selected', 'true');
    }
    d.setDate(d.getDate() + 1);
  }

  if ((dayOfWeek + daysInMonth) < 36) {
    this.hideLastRow();
  }
  else {
    this.showLastRow();
  }

};

DatePicker.prototype.hideLastRow = function () {
  this.lastRowNode.style.visibility = 'hidden';
};

DatePicker.prototype.showLastRow = function () {
  this.lastRowNode.style.visibility = 'visible';
};

DatePicker.prototype.setFocusDay = function (flag) {
  console.log('Datepicker setFocusday called .. . ');
  if (typeof flag !== 'boolean') {
    flag = true;
  }
  
  var fd = this.focusDay;
  // var fd = new Date ("2019-10-14")
  console.log('FD (focus day)',       fd);

  

  function checkDay (d) {
    // console.log('checkday called ---- D=', d.day);

    d.domNode.setAttribute('tabindex', '-1');
    if ((d.day.getDate()  == fd.getDate()) &&
        (d.day.getMonth() == fd.getMonth()) &&
        (d.day.getFullYear() == fd.getFullYear())) {
      d.domNode.setAttribute('tabindex', '0');
      if (flag) {
        console.log('');
        d.domNode.focus();
      }
    }
  }

  this.days.forEach(checkDay.bind(this));
};

DatePicker.prototype.updateDay = function (day) {
  //called when gird opens or changes
  console.log('ANOTHER updateDay called ');
  var d = this.focusDay;
  this.focusDay = day;
  console.log('updateDay focus day', this.focusDay);
  console.log('updateDay d', d);
  if ((d.getMonth() !== day.getMonth()) ||
      (d.getFullYear() !== day.getFullYear())) {
    this.updateGrid();
    this.setFocusDay();
  }
};

DatePicker.prototype.getDaysInLastMonth = function () {
  var fd = this.focusDay;
  var lastDayOfMonth = new Date(fd.getFullYear(), fd.getMonth(), 0);
  return lastDayOfMonth.getDate();
};

DatePicker.prototype.getDaysInMonth = function () {
  var fd = this.focusDay;
  var lastDayOfMonth = new Date(fd.getFullYear(), fd.getMonth() + 1, 0);
  return lastDayOfMonth.getDate();
};

DatePicker.prototype.show = function () {

  this.dialogNode.style.display = 'block';
  this.dialogNode.style.zIndex = 2;

  this.getDateInput();
  this.updateGrid();
  this.setFocusDay();

};

DatePicker.prototype.isOpen = function () {
  return window.getComputedStyle(this.dialogNode).display !== 'none';
};

DatePicker.prototype.hide = function () {

  this.setMessage('');

  this.dialogNode.style.display = 'none';

  this.hasFocusFlag = false;
  this.dateInput.setFocus();
};

DatePicker.prototype.handleBackgroundMouseDown = function (event) {
  if (!this.buttonNode.contains(event.target) &&
      !this.dialogNode.contains(event.target)) {

    this.isMouseDownOnBackground = true;

    if (this.isOpen()) {
      this.hide();
      event.stopPropagation();
      event.preventDefault();
    }
  }
};

DatePicker.prototype.handleBackgroundMouseUp = function () {
  this.isMouseDownOnBackground = false;
};


DatePicker.prototype.handleOkButton = function (event) {
  var flag = false;

  switch (event.type) {
    case 'keydown':

      switch (event.keyCode) {
        case this.keyCode.ENTER:
        case this.keyCode.SPACE:

          this.setTextboxDate();

          this.hide();
          flag = true;
          break;

        case this.keyCode.TAB:
          if (!event.shiftKey) {
            this.prevYearNode.focus();
            flag = true;
          }
          break;

        case this.keyCode.ESC:
          this.hide();
          flag = true;
          break;

        default:
          break;

      }
      break;

    case 'click':
      this.setTextboxDate();
      this.hide();
      flag = true;
      break;

    default:
      break;
  }

  if (flag) {
    event.stopPropagation();
    event.preventDefault();
  }
};

DatePicker.prototype.handleCancelButton = function (event) {
  var flag = false;

  switch (event.type) {
    case 'keydown':

      switch (event.keyCode) {
        case this.keyCode.ENTER:
        case this.keyCode.SPACE:
          this.hide();
          flag = true;
          break;

        case this.keyCode.ESC:
          this.hide();
          flag = true;
          break;

        default:
          break;

      }
      break;

    case 'click':
      this.hide();
      flag = true;
      break;

    default:
      break;
  }

  if (flag) {
    event.stopPropagation();
    event.preventDefault();
  }
};

DatePicker.prototype.handleNextYearButton = function (event) {
  var flag = false;

  switch (event.type) {

    case 'keydown':

      switch (event.keyCode) {
        case this.keyCode.ESC:
          this.hide();
          flag = true;
          break;

        case this.keyCode.ENTER:
        case this.keyCode.SPACE:
          this.moveToNextYear();
          this.setFocusDay(false);
          flag = true;
          break;
      }

      break;

    case 'click':
      this.moveToNextYear();
      this.setFocusDay(false);
      break;

    default:
      break;
  }

  if (flag) {
    event.stopPropagation();
    event.preventDefault();
  }
};

DatePicker.prototype.handlePreviousYearButton = function (event) {
  var flag = false;

  switch (event.type) {

    case 'keydown':

      switch (event.keyCode) {

        case this.keyCode.ENTER:
        case this.keyCode.SPACE:
          this.moveToPreviousYear();
          this.setFocusDay(false);
          flag = true;
          break;

        case this.keyCode.TAB:
          if (event.shiftKey) {
            this.okButtonNode.focus();
            flag = true;
          }
          break;

        case this.keyCode.ESC:
          this.hide();
          flag = true;
          break;

        default:
          break;
      }

      break;

    case 'click':
      this.moveToPreviousYear();
      this.setFocusDay(false);
      break;

    default:
      break;
  }

  if (flag) {
    event.stopPropagation();
    event.preventDefault();
  }
};

DatePicker.prototype.handleNextMonthButton = function (event) {
  var flag = false;

  switch (event.type) {

    case 'keydown':

      switch (event.keyCode) {
        case this.keyCode.ESC:
          this.hide();
          flag = true;
          break;

        case this.keyCode.ENTER:
        case this.keyCode.SPACE:
          this.moveToNextMonth();
          this.setFocusDay(false);
          flag = true;
          break;
      }

      break;

    case 'click':
      this.moveToNextMonth();
      this.setFocusDay(false);
      break;

    default:
      break;
  }

  if (flag) {
    event.stopPropagation();
    event.preventDefault();
  }
};

DatePicker.prototype.handlePreviousMonthButton = function (event) {
  var flag = false;

  switch (event.type) {

    case 'keydown':

      switch (event.keyCode) {
        case this.keyCode.ESC:
          this.hide();
          flag = true;
          break;

        case this.keyCode.ENTER:
        case this.keyCode.SPACE:
          this.moveToPreviousMonth();
          this.setFocusDay(false);
          flag = true;
          break;
      }

      break;

    case 'click':
      this.moveToPreviousMonth();
      this.setFocusDay(false);
      flag = true;
      break;

    default:
      break;
  }

  if (flag) {
    event.stopPropagation();
    event.preventDefault();
  }
};

DatePicker.prototype.moveToNextYear = function () {
  this.focusDay.setFullYear(this.focusDay.getFullYear() + 1);
  this.updateGrid();
};

DatePicker.prototype.moveToPreviousYear = function () {
  this.focusDay.setFullYear(this.focusDay.getFullYear() - 1);
  this.updateGrid();
};

DatePicker.prototype.moveToNextMonth = function () {
  this.focusDay.setMonth(this.focusDay.getMonth() + 1);
  this.updateGrid();
};

DatePicker.prototype.moveToPreviousMonth = function () {
  this.focusDay.setMonth(this.focusDay.getMonth() - 1);
  this.updateGrid();
};

DatePicker.prototype.moveFocusToDay = function (day) {
  //day is the date that the focus is about to move to 
  console.log('moveFocusToDay called .. . .');

  var d = this.focusDay;
  var dayDataDate = convertJSDayToDataDate(day);

  console.log('--->>> moveFocusDay datDataDate', dayDataDate);

  if(this.minDate && isLessThanMinDate(dayDataDate,this.minDate, dataDateFormat)) {
    console.log('moveFocusToDay --->>> move focus cancelled on account fo minDate');
    return;
}
  if(this.maxDate && isGreaterThanMaxDate(dayDataDate, this.maxDate, dataDateFormat)){
    console.log('moveFocusToDay --->>> move focus cancelled on account of maxDate');
    return;
  }
  console.log('moveFocusToDay --->>> NO MIN OR MAX DATE DISABLING');


  this.focusDay = day;

  if ((d.getMonth() != this.focusDay.getMonth()) ||
      (d.getYear() != this.focusDay.getYear())) {
    this.updateGrid();
  }
  this.setFocusDay();
};

DatePicker.prototype.moveFocusToNextDay = function () {
  console.log('moveFocusToNextDat called ....');
  var d = new Date(this.focusDay);
  d.setDate(d.getDate() + 1);
  this.moveFocusToDay(d);
};

DatePicker.prototype.moveFocusToNextWeek = function () {
  var d = new Date(this.focusDay);
  d.setDate(d.getDate() + 7);
  this.moveFocusToDay(d);
};

DatePicker.prototype.moveFocusToPreviousDay = function () {
  console.log('moveFocusToPrev day called .. . .');
  var d = new Date(this.focusDay);
  d.setDate(d.getDate() - 1);
  this.moveFocusToDay(d);
};

DatePicker.prototype.moveFocusToPreviousWeek = function () {
  console.log('moveFocusToPrevious Week Called');

  var d = new Date(this.focusDay);
  // console.log('moveFocusToPrevWeek var d  (current focus date) ', d);

  // var nextDate = d.setDate(d.getDate() - 7);
  // console.log(' moveFocusToPrevWeek next date', d.getDate()-7);
  // console.log('moveFocusToPrevWeek nextDate', nextDate);
  d.setDate(d.getDate() - 7);
  this.moveFocusToDay(d);
};

DatePicker.prototype.moveFocusToFirstDayOfWeek = function () {
  var d = new Date(this.focusDay);
  d.setDate(d.getDate() - d.getDay());
  this.moveFocusToDay(d);
};

DatePicker.prototype.moveFocusToLastDayOfWeek = function () {
  var d = new Date(this.focusDay);
  d.setDate(d.getDate() + (6 - d.getDay()));
  this.moveFocusToDay(d);
};

DatePicker.prototype.setTextboxDate = function (day) {
  if (day) {
    this.dateInput.setDate(day);
  }
  else {
    this.dateInput.setDate(this.focusDay);
  }
};

DatePicker.prototype.getDateInput = function () {
  console.log(' get date input called  . . . . ');


  // var parts = this.dateInput.getDate().split(/[\s,/]+/);
  // var formatParts = this.dateFormat.split(/[\s,/]+/);
  // var originalParts = this.dateInput.getDate().split(/[\s,/]+/);

  // if ((parts.length === 3) &&
  //     Number.isInteger(parseInt(parts[0])) &&
  //     Number.isInteger(parseInt(parts[1])) &&
  //     Number.isInteger(parseInt(parts[2]))) 
  //       {
        
  //       var month = parseInt(parts[formatParts.indexOf('mm')]) - 1;
  //       var day = parseInt(parts[formatParts.indexOf('dd')]);
  //       var year = parseInt(parts[formatParts.indexOf('yyyy')]);

  //   this.focusDay = splitDataDateAndCreateNewDate(this.dateInput.getDate(), this.dateFormat);
  //   this.selectedDay = new Date(this.focusDay);
  // }

   //retuns a the date inside the input box if there is one 
  let inputBoxDate = splitDataDateAndCreateNewDate(this.dateInput.getDate(), this.dateFormat)

  if(inputBoxDate) return inputBoxDate
  else {
    //there is no date in the input box 
    console.log('TODAY AD DATSA DATE', today);
    if(this.specifiedFocusDate) this.focusDay = splitDataDateAndCreateNewDate(this.specifiedFocusDate, dataDateFormat);
    else if(this.minDate && isLessThanMinDate(today,this.minDate, dataDateFormat)) this.focusDay = splitDataDateAndCreateNewDate(this.minDate, dataDateFormat);
    else if(this.maxDate && isGreaterThanMaxDate(today,this.maxDate, dataDateFormat )) this.focusDay = splitDataDateAndCreateNewDate(this.maxDate, dataDateFormat)

    else this.focusDay = new Date();

    this.selectedDay = new Date(0,0,1);
  }

};

DatePicker.prototype.getDateForButtonLabel = function (year, month, day) {
  if (typeof year !== 'number' || typeof month !== 'number' || typeof day !== 'number') {
    this.selectedDay = this.focusDay;
  }
  else {
    this.selectedDay = new Date(year, month, day);
  }

  var label = this.dayLabels[this.selectedDay.getDay()];
  label += ' ' + this.monthLabels[this.selectedDay.getMonth()];
  label += ' ' + (this.selectedDay.getDate());
  label += ', ' + this.selectedDay.getFullYear();
  return label;
};

DatePicker.prototype.setMessage = function (str) {

  function setMessageDelayed () {
    this.messageNode.textContent = str;
  }

  if (str !== this.lastMessage) {
    setTimeout(setMessageDelayed.bind(this), 200);
    this.lastMessage = str;
  }
};


export default DatePicker;