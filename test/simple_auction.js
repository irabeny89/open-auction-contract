const SimpleAuction = artifacts.require("SimpleAuction");

const { reduceString } = require("../utils")

contract("SimpleAuction", async (accounts) => {
  const msBiddingTime = 6e4
  const beneficiaryAccount = accounts[0]
  const highestBidderAccount = accounts[1]
  // bid value
  const highestBid = 1e6;

  it(`beneficiary should be ${reduceString(beneficiaryAccount)} and bidding period should be ${msBiddingTime / 1e3}s`, async () => {
    const contract = await SimpleAuction.deployed();

    const beneficiary = await contract.beneficiary()

    const auctionEndTime = await contract.auctionEndTime(),
      msAuctionEndTime = new Date(auctionEndTime.toNumber() * 1e3),
      approxBidPeriod = Math.ceil((msAuctionEndTime - new Date) / 1e4) * 1e4

    assert.equal(msBiddingTime, approxBidPeriod)
    assert.equal(beneficiary, beneficiaryAccount)
  });

  it(`bid with ${highestBid / 1e6} gwei as highest bid from ${reduceString(highestBidderAccount)} as highest bidder`, async () => {
    const contract = await SimpleAuction.deployed()

    const {
      logs: [{
        args: { bidder, amount }
      }]
    } = await contract.bid({
      from: highestBidderAccount, value: highestBid
    })
    const highestBidder = await contract.highestBidder()
    const highestBid_ = await contract.highestBid()

    assert.equal(bidder, highestBidderAccount)
    assert.equal(highestBid_, amount.toNumber())
    assert.equal(highestBid_, highestBid)
    assert.equal(highestBidder, highestBidderAccount)
  })

  it(`withdraw ${highestBid / 1e6} gwei with ${reduceString(highestBidderAccount)}`, async () => {
    const contract = await SimpleAuction.deployed()

    const {
      receipt: { status }
    } = await contract.withdraw()

    assert.equal(status, true)
  })

  it(`reverts on early auction end attempt`, async () => {
    const contract = await SimpleAuction.deployed()

    try {
      await contract.auctionEnd()
    } catch (error) {
      assert.equal(error.data.message, "revert")
    }
  })

  it(`winner should be ${reduceString(highestBidderAccount)}; beneficiary ${reduceString(beneficiaryAccount)} receives the highest bid of ${highestBid / 1e6} gwei`, async () => {
    const contract = await SimpleAuction.deployed()

    const beneficiaryBalanceBefore = await web3.eth.getBalance(beneficiaryAccount)

    // delay till end of auction before ending it
    setTimeout(async () => {
      const {
        logs: [{ args: { winner, amount } }]
      } = await contract.auctionEnd()

      const beneficiaryBalanceAfter = await web3.eth.getBalance(beneficiaryAccount)

      const beneficiaryGain = beneficiaryBalanceAfter - beneficiaryBalanceBefore

      assert.equal(winner, beneficiaryAccount)
      assert.equal(amount, highestBid)
      assert.equal(beneficiaryGain, amount)
    }, msBiddingTime)
  })
});
