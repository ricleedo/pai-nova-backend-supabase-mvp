#supabase install
PS D:\User\pai-nova-backend-supabase-mvp> npx supabase --version
Need to install the following packages:
supabase@2.48.3
Ok to proceed? (y) y

npm warn deprecated node-domexception@1.0.0: Use your platform's native DOMException instead
2.48.3

#supabase login

PS D:\User\pai-nova-backend-supabase-mvp> npx supabase login
Hello from Supabase! Press Enter to open browser and login automatically.

Here is your login link in case browser did not open https://supabase.com/dashboard/cli/login?session_id=*******&token_name=cli_SERVER\******&public_key=********

Enter your verification code: ******
Token cli_SERVER\user@server_1759650266 created successfully.

You are now logged in. Happy coding!

#connect supabase project to local repo
PS D:\User\pai-nova-backend-supabase-mvp> npx supabase link --project-ref tonnhtsazjbyoithjcpu
Initialising login role...
Connecting to remote database...
Finished supabase link.
PS D:\User\pai-nova-backend-supabase-mvp> npx supabase db push
Initialising login role...
Connecting to remote database...
Do you want to push these migrations to the remote database?
 • 20251004150228_create_pai_care_schema.sql

 [Y/n] y
Applying migration 20251004150228_create_pai_care_schema.sql...
Finished supabase db push.