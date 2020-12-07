"use strict";

const AWS = require("aws-sdk");
const moment = require("moment");

AWS.config.update({
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  accessKeyId: process.env.AWS_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

const call = (action, params) => {
  const dynamoDB = new AWS.DynamoDB.DocumentClient({
    apiVersion: "2012-08-10",
  });
  return dynamoDB[action](params).promise();
};

const mapPropsToDynamoDB = {
  _id: "id",
  Metric_Being_Measured: "metric",
  Challenge_Name: "name",
  Goal_Description: "goalDescription",
  Monthly_Challenge: "monthly",
  Challenge_Timeframe: "timeFrame",
  FitCoin_Reward: "fitCoinReward",
  Challenge_Goal_Quantity: "goalQuantity",
  createdAt: "createdAt",
  updatedAt: "updatedAt",
  Personal_Challenge: "personal",
};

const parseDataToDynamoDB = (data) => {
  const parsedUpdateData = {};

  Object.keys(data).forEach((key) => {
    const dynamoDBProp = mapPropsToDynamoDB[key];

    if (dynamoDBProp) {
      if (dynamoDBProp === "updatedAt" || dynamoDBProp === "createdAt") {
        parsedUpdateData[dynamoDBProp] = data[key].toISOString();
      } else if (dynamoDBProp === "id") {
        parsedUpdateData[dynamoDBProp] = data[key].toString();
      } else {
        parsedUpdateData[dynamoDBProp] = data[key];
      }
    }
  });

  return parsedUpdateData;
};

const createUpdateExpression = (data) => {
  let updateExpression = "SET ";
  const attributeValues = {};
  const attributeNames = {};

  Object.keys(data).forEach((key) => {
    updateExpression += `#${key} = :${key}, `;
    attributeValues[`:${key}`] = data[key];
    attributeNames[`#${key}`] = key;
  });

  updateExpression = updateExpression.slice(0, -2);

  return {
    UpdateExpression: updateExpression,
    ExpressionAttributeNames: attributeNames,
    ExpressionAttributeValues: attributeValues,
  };
};

/**
 * Read the documentation () to implement custom service functions
 */

module.exports = {
  saveChallengeInDynamoDB: async (updateData) => {
    // console.log({ updateData });
    const parsedData = parseDataToDynamoDB(updateData);
    // console.log({ parsedData });

    if (parsedData.id) {
      const createdAt = new Date().toISOString();
      const params = {
        TableName: process.env.CHALLENGE_TABLE_NAME,
        Item: {
          monthly: false,
          personal: false,
          periodDate: moment().format("YYYY-MM"),
          createdAt,
          updatedAt: createdAt,
          ...parsedData,
        },
      };
      // console.log({ params });
      await call("put", params);
    }
  },

  updateChallengeInDynamoDB: async (updateData) => {
    // console.log({ updateData });
    const parsedData = parseDataToDynamoDB(updateData);
    const id = parsedData.id;
    delete parsedData.id;
    const updateExpression = createUpdateExpression(parsedData);
    // console.log({ parsedData });

    if (id) {
      const params = {
        TableName: process.env.CHALLENGE_TABLE_NAME,
        Key: { id, periodDate: moment().format("YYYY-MM") },
        ...updateExpression,
      };
      // console.log({ params });
      await call("update", params);
    }
  },
};
