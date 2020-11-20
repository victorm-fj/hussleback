"use strict";

const QRCode = require("qrcode");
const path = require("path");
const fs = require("fs");

const qrCodeTempPath = path.join(__dirname, "QRCode.png");

const generateQRCode = (info) => {
  return new Promise((resolve, reject) => {
    QRCode.toFile(qrCodeTempPath, info, { type: "png" }, function (err) {
      if (err) {
        return reject(err);
      }
      return resolve();
    });
  });
};

/**
 * Read the documentation () to implement custom service functions
 */

module.exports = {
  createQRCode: async (businessId) => {
    try {
      const info = JSON.stringify({ id: businessId });
      await generateQRCode(info);
      const buffer = fs.readFileSync(qrCodeTempPath);

      const payload = {
        badRequest: (_, errors) => {
          console.error("badRequest", JSON.stringify(errors, null, 2));
        },
        send: (data) => {
          console.log("send", JSON.stringify(data, null, 2));
        },
        request: {
          files: {
            files: [
              {
                path: qrCodeTempPath,
                name: `${businessId}-QRCode.png`,
                type: "image/png",
                size: Buffer.byteLength(buffer),
              },
            ],
          },
          body: {
            refId: businessId,
            ref: "businesses",
            field: "QR_Code",
          },
        },
      };
      // Look here to see upload fn implementation
      // https://github.com/strapi/strapi/blob/v3.0.0-beta.17.4/packages/strapi-plugin-upload/controllers/Upload.js#L12
      await strapi.plugins.upload.controllers.upload.upload(payload);
    } catch (error) {
      console.error(error);
    }
  },
};
