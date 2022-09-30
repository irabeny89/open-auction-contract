module.exports = async (deployer, _, accounts) => await deployer.deploy(
  artifacts.require("SimpleAuction"),
  // 1min bidding period passed as 60sec
  60,
  accounts[0],
)