grant connect to oa2;
grant dba to oa2;

util.setUserOption 'asamium.default.domain', 'oa2';

meta.defineType 'name:CODE';
meta.defineType 'secret:STRING';
meta.defineType 'isTrusted:BOOL';
meta.defineType 'isDisabled:BOOL';
meta.defineType 'isDeleted:BOOL';
meta.defineType 'isUsed:BOOL';
meta.defineType 'code:STRING';
meta.defineType 'token:STRING';
meta.defineType 'expiresAt:TS';
meta.defineType 'attempts:INT,1';
meta.defineType 'scope:STRING';
meta.defineType 'mobile_number:STRING';
meta.defineType 'email:STRING';
meta.defineType 'status:MEDIUM';
meta.defineType 'url:STRING';

meta.defineEntity 'Account',
    ''
;

meta.defineEntity 'Client',
    'name;secret;isTrusted;isDisabled'
;

meta.defineEntity 'Login',
    'code;expiresAt;attempts,,0;isDeleted',
    'Client,,nullable;Account;AccessToken,,nullable'
;

meta.defineEntity 'AuthCode',
    'code;redirectURI,url;scope;isUsed;isDeleted',
    'Client;Account;'
;

meta.defineEntity 'RefreshToken',
    'code;expiresAt;isDeleted',
    'Client;Account;AuthCode'
;

meta.defineEntity 'AccessToken',
    'code;expiresAt;isDeleted',
    'Client;Account;RefreshToken,,nullable'
;

--meta.createTable 'Account',0,1;
meta.createTable 'Client',0,1;
meta.createTable 'Login',0,1;
meta.createTable 'AuthCode',0,1;
meta.createTable 'RefreshToken',0,1;
meta.createTable 'AccessToken',0,1;

alter table oa2.[Login] add foreign key(account) references pha.Agent;
alter table oa2.AuthCode add foreign key(account) references pha.Agent;
alter table oa2.RefreshToken add foreign key(account) references pha.Agent;
alter table oa2.AccessToken add foreign key(account) references pha.Agent;

alter table oa2.[Login] modify author null;
alter table oa2.AuthCode modify author null;
alter table oa2.RefreshToken modify author null;
alter table oa2.AccessToken modify author null;
alter table oa2.Client modify author null;
