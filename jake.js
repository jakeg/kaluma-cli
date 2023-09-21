// Just want to flash a file to the Pi Pico, nothing else for now

const { SerialPort } = require("serialport")
const ymodem = require("./util/ymodem")

let port = '/dev/ttACM0' // TODO: not hard coded; could just get last entry in SerialPort.list() by default?
let baudRate = 115200

// flash code
const serial = new SerialPort({ port, path: './', baudRate, autoOpen: false });

let delay = ms => new Promise(resolve => setTimeout(resolve, ms))

serial.open(async (err) => {
  if (err) console.error(err)
  else {
    console.log(`Connected to ${port}`)
  }
})

// serial.open(async (err) => {
//   if (err) {
//     console.error(err);
//   } else {
//     console.log(`connected to ${port}`);
//     if (options.shell) {
//       console.log(`To exit: ctrl+z`);
//       bind(serial, [
//         {
//           keycode: 0x1a,
//           callback: () => {
//             process.exit(0);
//           },
//         },
//       ]);
//       serial.write("\r.hi\r");
//       await delay(100);
//     }

//     try {
//       if (!options.shell) {
//         process.stdout.write(colors.grey("flashing "));
//       }
//       const result = await flash(serial, code, () => {
//         if (!options.shell) {
//           process.stdout.write(colors.grey("."));
//         }
//       });
//       if (!options.shell) {
//         process.stdout.write("\r\n");
//       }
//       await delay(500);
//       // load written code
//       if (options.load) {
//         serial.write("\r");
//         serial.write(".load\r");
//         await delay(500);
//       }
//       if (!options.shell && serial.isOpen) {
//         serial.close();
//       }
//       if (!options.shell) {
//         console.log(`${result.writtenBytes} flashed`);
//       }
//     } catch (err) {
//       console.log(err);
//     }
//   }
// });

function flash(serial, code, packetCallback) {
  return new Promise((resolve, reject) => {
    // Turn to flash writing mode
    serial.write("\r");
    serial.write(".flash -w\r");
    setTimeout(() => {
      // Send the file via Ymodem protocol
      let buffer = Buffer.from(code, "utf8");
      ymodem.transfer(
        serial,
        "usercode",
        buffer,
        (err, result) => {
          if (err) {
            reject(err);
          } else {
            resolve(result);
          }
        },
        packetCallback
      );
    }, 500);
  });
}




function bind(serial, intercept) {
  process.stdin.setRawMode(true);
  process.stdin.on("data", (chunk) => {
    if (Array.isArray(intercept)) {
      let intercepted = false;
      intercept.forEach((i) => {
        if (chunk[0] === i.keycode) {
          i.callback();
          intercepted = true;
        }
      });
      if (!intercepted) {
        serial.write(chunk);
      }
    } else {
      serial.write(chunk);
    }
  });
  serial.on("data", (chunk) => {
    process.stdout.write(chunk);
  });
}