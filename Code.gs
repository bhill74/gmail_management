//************************************************************
//%NAME: deleteOlder()
//%DESCRIPTION:
// Find all messages/threads within the given label and if
// the date of the message is older than the given date it is
// moved to the trash.
//%ARGUMENTS:
// maxDate -- The date to compare to the message.
// label -- The label to retrieve the messages from.
// logger -- For collecting the log messages.
//%RETURNS:
// The logged information.
//************************************************************
function deleteOlderThan(maxDate, label, logger) {    
  logger.add("------ " + label.getName() + "  [earlier than " + maxDate + "] ------");
  
  var start = 0;
  var delta = 300;
  var threads = [];
  while (true) {
    var t = label.getThreads(start, delta);    
    if (t.length == 0) {
      break;
    }
    threads = threads.concat(t);
    start += delta;
  }
  
  var removed = 0;
  var remain = 0;
  for(var i = 0; i < threads.length; i++) {
    if (threads[i].isInTrash() == true) {
      continue;
    }
    
    if (isNaN(threads[i].getLastMessageDate())) {
      logger.add(" * Date unreadable, message: " + threads[i].getFirstMessageSubject());
      continue;
    }
    
    if (threads[i].getLastMessageDate() < maxDate) {
      logger.add(" * Moved: " + threads[i].getFirstMessageSubject() + " / " + threads[i].getLastMessageDate());
      threads[i].moveToTrash();
      removed++;
    } else {
      remain++;
    }
  }
  
  logger.add(" Moved " + removed + " threads (" + remain + " threads untouched)");
}

//************************************************************
//%NAME: shiftDate()
//%DESCRIPTION:
// Finds the date relative to NOW that corresponds to the
// given keyword and numeric value.
//%ARGUMENTS:
// num -- The amount to shift the date backwards by
// increment -- The increment to consider when shifting.
// logger -- For collecting the log messages.
//%RETURNS:
// A modified Date value or null if the increment was invalid.
//************************************************************
function shiftDate(num, increment, logger) {
  var maxDate = new Date();    
  switch(increment) {
    case 'Day':
      maxDate.setDate(maxDate.getDate()-num);   
      break;
    case 'Week':
      maxDate.setDate(maxDate.getDate()-num*7);
      break;
    case 'Month':
      maxDate.setMonth(maxDate.getMonth() - num);
      break;
    case 'Year':      
      maxDate.setYear(maxDate.getYear() - num);
      break;
    case 'Hour':
      maxDate.setHour(maxDate.getHour() - num);
      break;
    case 'Minute':
      maxDate.setMinute(maxDate.getMinute() - num);
      break;
    case 'Second':
      maxDate.setSecond(maxDate.getSecond() - num);
      break;
    default:
      logger.add("** Unknown date type: " + increment + " **");
      return null;
      break;
  }  

  return maxDate;
}

//************************************************************
//%NAME: cleanup()
//%DESCRIPTION:
// Find all labels of the format "Delete#" and removed threads
// from that label that are older than the corresponding date
// (relative to now).
//%ARGUMENTS:
// None.
//%RETURNS:
// Nothing.
//************************************************************
function cleanup() {
  var labels = GmailApp.getUserLabels();  
  for(var i = 0; i < labels.length; i++) {
    var name = labels[i].getName(); 
    var match = name.match(/^(.*\/)?Delete(\d+)((Second|Minute|Hour|Day|Week|Month|Year)s?)(Email)?$/);
    if (match == null) {
      continue;
    }           

    logger = new MyLogger.create("Parsing of '" + name + "'");
    
    if (match[2] == 1 && match[4] != match[3]) {
      logger.add("** " + name + " has the wrong pluralization of " + match[3]);
    } else {  
      var maxDate = shiftDate(match[2], match[4], logger);  
      if (maxDate == null) {
        logger.add("** " + name + " does not result in a date shift");
      }
    
      deleteOlderThan(maxDate, labels[i], logger);
    }
    
    if (match[5]) logger.send();    
  }
}