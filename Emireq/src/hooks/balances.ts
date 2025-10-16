import { ethers } from 'ethers';
import ERC20ABI from "../../backend/artifacts/contracts/mocks/MockERC20.sol/MockERC20.json";

export const getUserTokenBalance = async (user: string, token: string) => {
    if (!user) return 0;
    const provider = new ethers.BrowserProvider(window.ethereum);

    const contract = new ethers.Contract(token, ERC20ABI.abi, provider);
    const decimals = await contract.decimals();
    const balance = await contract.balanceOf(user);
    return ethers.formatUnits(balance, decimals);
  }