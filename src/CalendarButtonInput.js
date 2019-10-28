/*
*   This content is licensed according to the W3C Software License at
*   https://www.w3.org/Consortium/Legal/2015/copyright-software-and-document
*
*   File:   calendar-button.js
*/


//for commit 
import DatePicker from './DatePicker';
import {splitByDelineator, constValue} from './Utilities'

console.log('hello from Calendar');
console.log('Datepicker---->', DatePicker);

//CHANGED
// var DatePicker = DatePicker || {};
//HELLOoooooo

var CalendarButtonInput = function(inputNode, buttonNode, datepicker,dateFormat, setState) {
  this.inputNode    = inputNode;
  this.buttonNode   = buttonNode;
  this.imageNode    = false;

  this.datepicker = datepicker;
  this.dateFormat = dateFormat.toLowerCase();
  this.defaultLabel = 'Choose Date';
  this.setState = setState

  this.keyCode = Object.freeze({
    'ENTER': 13,
    'SPACE': 32
  });
};



CalendarButtonInput.prototype.init = function () {
  this.buttonNode.addEventListener('click', this.handleClick.bind(this));
  this.buttonNode.addEventListener('keydown', this.handleKeyDown.bind(this));
  this.buttonNode.addEventListener('focus', this.handleFocus.bind(this));
};

CalendarButtonInput.prototype.handleKeyDown = function (event) {
  var flag = false;

  switch (event.keyCode) {

    case this.keyCode.SPACE:
    case this.keyCode.ENTER:
      this.datepicker.show();
      this.datepicker.setFocusDay();
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

//CHANGED - put event into take in
CalendarButtonInput.prototype.handleClick = function (evt) {
  if (!this.datepicker.isOpen()) {
    this.datepicker.show();
    this.datepicker.setFocusDay();
  }
  else {
    this.datepicker.hide();
  }

  evt.stopPropagation();
  evt.preventDefault();

};

CalendarButtonInput.prototype.setLabel = function (str) {
  if (typeof str === 'string' && str.length) {
    str = ', ' + str;
  }
  this.buttonNode.setAttribute('aria-label', this.defaultLabel + str);
};

CalendarButtonInput.prototype.setFocus = function () {
  this.buttonNode.focus();
};

CalendarButtonInput.prototype.setDate = function (day) {
  console.log('setDate SET STATE', this.setState);
  console.log('---->>> setDate called', day);
  let dateFormatString = this.dateFormat;
  console.log('DATE FORMAT STRING', dateFormatString)
  let newDateString = dateFormatString.replace("yyyy",day.getFullYear())
                                      .replace("mm",(day.getMonth() + 1))
                                      .replace("dd",day.getDate())
  // this.inputNode.value = (day.getMonth() + 1) + '/' + day.getDate() + '/' + day.getFullYear();
  this.inputNode.value = newDateString
  var DOMinputBoxValueChange = new CustomEvent('DOMinputBoxValueChange')

  this.inputNode.dispatchEvent(DOMinputBoxValueChange)
  console.log('INPUT NODE', this.inputNode);
  // console.log('CONST VALUE', constValue);
  // // constValue= "Hellooooo"
  // this.setState({indexStateText: "YEAAAA"})
  console.log('after set value', this.inputNode.value);
};

CalendarButtonInput.prototype.getDate = function () {
  return this.inputNode.value;
};

CalendarButtonInput.prototype.getDateLabel = function () {
  // provides the date for the "the selected date is ${dateLabel}" dialogue for  the calendar button's label
  console.log(' ---->>>getDateLabel called');
  console.log('---->>>getDateLabel input node value', this.inputNode.value);
  console.log('---->>>getDateLabel input node dateFormat', this.inputNode.value);
  console.log('---->>>getDateLabel splitByDelineator', splitByDelineator);


  var label = '';
  var parts = splitByDelineator(this.inputNode.value)
  var formatParts = splitByDelineator(this.dateFormat)

  console.log('getD parts', parts);
  console.log('getD format parts', formatParts);

  if ((parts.length === 3) &&
      Number.isInteger(parseInt(parts[0])) &&
      Number.isInteger(parseInt(parts[1])) &&
      Number.isInteger(parseInt(parts[2]))) {

    var month = parseInt(parts[formatParts.indexOf('mm')]) - 1;
    var day = parseInt(parts[formatParts.indexOf('dd')]);
    var year = parseInt(parts[formatParts.indexOf('yyyy')]);
    
    label = this.datepicker.getDateForButtonLabel(year, month, day);
  }
  // console.log('the label inside getDateLabel----->>', label )
  return label;
};

CalendarButtonInput.prototype.handleFocus = function () {
  console.log('-------------------------------------------------------------------');
  console.log('CalendarButtonInput handle focus (selected date is...) called');
  var dateLabel = this.getDateLabel();
console.log('dateLabel', dateLabel);
  if (dateLabel) {
    this.setLabel('selected date is ' + dateLabel);
  }
  else {
    this.setLabel('');
  }
};
CalendarButtonInput.prototype.findDivider = function(){}


export default CalendarButtonInput;