/**
 * Your Copyright Here
 *
 * Appcelerator Titanium is Copyright (c) 2009-2010 by Appcelerator, Inc.
 * and licensed under the Apache Public License (version 2)
 */
#import "TiModule.h"
#import "Couchbase/CouchbaseMobile.h"

#define kEventServerStarted @"com.obscure.couchbase_ti.server_started"
#define kEventParamServerURL @"serverUrl"

@interface ComObscureCouchbaseTiModule : TiModule <CouchbaseDelegate> {
}
@property (nonatomic, retain) CouchbaseMobile *server;
-(void)startCouchbase:(id)args;
@end
