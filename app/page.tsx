import {getChatGPTUser,chatGPTSignInPath} from './chatgpt-auth';
import Tool from './Tool';
import PublicStudio from './PublicStudio';
export const dynamic='force-dynamic';
export default async function Page(){const user=await getChatGPTUser();return user?<Tool userId={user.userId}/>:<PublicStudio signInUrl={chatGPTSignInPath('/')}/>}
